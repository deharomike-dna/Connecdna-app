-- =============================================================================
-- ConneCDNA / Silvermoon Capital LLC
-- Legal & Compliance Schema
-- Migration: 20260509000001_legal_compliance_schema.sql
--
-- Purpose:
--   Persist the source-of-truth pointers for all published legal documents,
--   their version history, every user/organization acceptance event, and a
--   tamper-evident audit trail of compliance-relevant actions.
--
--   The body of each policy is stored as MDX in /legal-content (single source
--   of truth, versioned in git). This schema only stores published-version
--   metadata, the SHA-256 hash of each released MDX file, acceptance records,
--   and audit events — so that the platform can prove what was shown to a
--   given user at a given moment.
--
-- Conventions:
--   - All tables use uuid PKs generated server-side.
--   - All timestamps are timestamptz.
--   - RLS is enabled on every table; service role bypasses it for backend writes.
--   - Append-only tables (policy_acceptances, audit_log_events) have no UPDATE
--     or DELETE policies for end users.
-- =============================================================================

-- Required extensions (Supabase enables these by default; included for clarity).
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- legal_documents
-- One row per logical legal document (Terms of Service, Privacy Policy, etc.).
-- Slug is stable; the content body is in MDX, only the active pointer lives here.
-- -----------------------------------------------------------------------------
create table if not exists public.legal_documents (
    id                  uuid primary key default uuid_generate_v4(),
    slug                text not null unique,        -- e.g. 'terms', 'privacy', 'fees'
    title               text not null,               -- Display title
    category            text not null,               -- 'core' | 'disclosure' | 'framework'
    required_at_signup  boolean not null default true,
    requires_reaccept_on_update boolean not null default true,
    active_version_id   uuid,                        -- FK set after first publish
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now()
);

comment on table public.legal_documents is
    'Catalog of legal documents. Body is in /legal-content MDX; this row tracks the active published version.';

-- -----------------------------------------------------------------------------
-- policy_versions
-- Immutable, append-only history of every published version of a document.
-- content_sha256 hashes the exact MDX bytes that were released, so any
-- acceptance record can be cryptographically tied to a specific text.
-- -----------------------------------------------------------------------------
create table if not exists public.policy_versions (
    id                  uuid primary key default uuid_generate_v4(),
    document_id         uuid not null references public.legal_documents(id) on delete restrict,
    version             text not null,               -- semver-like, e.g. '1.0.0'
    effective_date      date not null,
    last_updated        date not null,
    content_sha256      text not null,               -- hex of SHA-256(MDX bytes)
    content_url         text,                        -- canonical URL to the rendered policy
    summary_of_changes  text,                        -- human-readable changelog
    published_by        uuid,                        -- auth.users(id) of publisher
    published_at        timestamptz not null default now(),
    is_material_change  boolean not null default false,  -- forces re-acceptance when true
    unique (document_id, version)
);

comment on table public.policy_versions is
    'Append-only published-version history. content_sha256 binds acceptances to exact text.';

-- Late-bound FK so legal_documents can reference its current active version.
alter table public.legal_documents
    add constraint legal_documents_active_version_fk
    foreign key (active_version_id) references public.policy_versions(id) on delete set null;

create index if not exists policy_versions_document_id_idx on public.policy_versions (document_id);
create index if not exists policy_versions_effective_date_idx on public.policy_versions (effective_date desc);

-- -----------------------------------------------------------------------------
-- policy_acceptances
-- Append-only ledger of every acceptance event (signup, re-acceptance after a
-- material update, in-app re-acknowledgement). One row per accepted document
-- per user per acceptance occasion.
-- -----------------------------------------------------------------------------
create table if not exists public.policy_acceptances (
    id                  uuid primary key default uuid_generate_v4(),
    user_id             uuid not null references auth.users(id) on delete cascade,
    organization_id     uuid,                        -- nullable for individual users
    document_id         uuid not null references public.legal_documents(id) on delete restrict,
    policy_version_id   uuid not null references public.policy_versions(id) on delete restrict,
    accepted_at         timestamptz not null default now(),
    acceptance_context  text not null,               -- 'signup' | 'reacceptance' | 'transaction' | 'enterprise_msa'
    ip_address          inet,
    user_agent          text,
    device_metadata     jsonb,                       -- platform, os, app version, locale
    geographic_region   text,                        -- ISO 3166-2, derived from IP/declared
    jurisdiction        text,                        -- e.g. 'US-DE', 'US-CA', 'EEA'
    content_sha256      text not null,               -- copy from policy_versions for tamper-evidence
    signature_hash      text,                        -- hash of canonicalized acceptance payload
    created_at          timestamptz not null default now()
);

comment on table public.policy_acceptances is
    'Append-only acceptance ledger. Captures user, version, time, IP, device, jurisdiction, and content hash.';

create index if not exists policy_acceptances_user_id_idx on public.policy_acceptances (user_id);
create index if not exists policy_acceptances_org_id_idx on public.policy_acceptances (organization_id);
create index if not exists policy_acceptances_doc_version_idx
    on public.policy_acceptances (document_id, policy_version_id);
create index if not exists policy_acceptances_user_doc_idx
    on public.policy_acceptances (user_id, document_id, accepted_at desc);

-- -----------------------------------------------------------------------------
-- policy_review_required_users
-- Materialized list of users who must re-accept after a material policy update.
-- Cleared per-document when the user records a fresh acceptance.
-- -----------------------------------------------------------------------------
create table if not exists public.policy_review_required_users (
    id                  uuid primary key default uuid_generate_v4(),
    user_id             uuid not null references auth.users(id) on delete cascade,
    document_id         uuid not null references public.legal_documents(id) on delete cascade,
    triggering_version_id uuid not null references public.policy_versions(id) on delete cascade,
    created_at          timestamptz not null default now(),
    cleared_at          timestamptz,
    unique (user_id, document_id, triggering_version_id)
);

comment on table public.policy_review_required_users is
    'Gate list. While a row is uncleared for (user, document), the app must force re-acceptance.';

create index if not exists policy_review_required_pending_idx
    on public.policy_review_required_users (user_id) where cleared_at is null;

-- -----------------------------------------------------------------------------
-- audit_log_events
-- Tamper-evident append-only event stream for compliance evidence trails.
-- prev_event_hash + event_hash form a hash chain so any deletion or edit
-- breaks the chain and is detectable.
-- -----------------------------------------------------------------------------
create table if not exists public.audit_log_events (
    id                  uuid primary key default uuid_generate_v4(),
    sequence_no         bigserial unique,            -- monotonic ordering
    event_type          text not null,               -- e.g. 'policy.accepted', 'transaction.disclosure_shown'
    actor_user_id       uuid references auth.users(id) on delete set null,
    organization_id     uuid,
    subject_type        text,                        -- e.g. 'document', 'workflow', 'integration'
    subject_id          text,
    payload             jsonb not null default '{}'::jsonb,
    ip_address          inet,
    user_agent          text,
    occurred_at         timestamptz not null default now(),
    prev_event_hash     text,                        -- hex; null only for first row
    event_hash          text not null                -- hex of canonical(payload + prev hash)
);

comment on table public.audit_log_events is
    'Append-only, hash-chained audit log for compliance evidence (Document 8).';

create index if not exists audit_log_actor_idx on public.audit_log_events (actor_user_id, occurred_at desc);
create index if not exists audit_log_org_idx on public.audit_log_events (organization_id, occurred_at desc);
create index if not exists audit_log_event_type_idx on public.audit_log_events (event_type, occurred_at desc);

-- -----------------------------------------------------------------------------
-- transaction_disclosure_views
-- Persistent record that the non-custodial banner was displayed before any
-- transaction / settlement / escrow / payment-orchestration workflow.
-- This is the operational evidence required by Document 6 (Disclaimer Framework)
-- and the safeguards in Document 5 (Transaction Flow Memo).
-- -----------------------------------------------------------------------------
create table if not exists public.transaction_disclosure_views (
    id                  uuid primary key default uuid_generate_v4(),
    user_id             uuid not null references auth.users(id) on delete cascade,
    organization_id     uuid,
    workflow_id         text not null,
    workflow_type       text not null,              -- 'payment' | 'settlement' | 'escrow_like' | 'banking' | 'identity'
    disclosure_version  text not null,              -- Track the exact disclaimer text shown
    surface             text not null,              -- 'web' | 'mobile_ios' | 'mobile_android' | 'api'
    shown_at            timestamptz not null default now(),
    acknowledged_at     timestamptz,
    ip_address          inet,
    user_agent          text
);

create index if not exists tx_disc_user_idx on public.transaction_disclosure_views (user_id, shown_at desc);
create index if not exists tx_disc_workflow_idx on public.transaction_disclosure_views (workflow_id);

-- -----------------------------------------------------------------------------
-- updated_at trigger for legal_documents
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists trg_legal_documents_set_updated_at on public.legal_documents;
create trigger trg_legal_documents_set_updated_at
    before update on public.legal_documents
    for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Material-change trigger: when a policy_versions row is inserted with
-- is_material_change = true, fan out review-required rows for all current users.
-- -----------------------------------------------------------------------------
create or replace function public.fanout_policy_reacceptance()
returns trigger
language plpgsql
security definer
as $$
begin
    if new.is_material_change then
        insert into public.policy_review_required_users (user_id, document_id, triggering_version_id)
        select u.id, new.document_id, new.id
        from auth.users u
        on conflict (user_id, document_id, triggering_version_id) do nothing;
    end if;
    return new;
end;
$$;

drop trigger if exists trg_policy_versions_fanout on public.policy_versions;
create trigger trg_policy_versions_fanout
    after insert on public.policy_versions
    for each row execute function public.fanout_policy_reacceptance();

-- -----------------------------------------------------------------------------
-- Acceptance-clears-review trigger
-- When a user records a fresh acceptance for a document, mark any uncleared
-- review-required rows for that (user, document) as cleared.
-- -----------------------------------------------------------------------------
create or replace function public.clear_review_required_on_acceptance()
returns trigger
language plpgsql
security definer
as $$
begin
    update public.policy_review_required_users
       set cleared_at = now()
     where user_id = new.user_id
       and document_id = new.document_id
       and cleared_at is null;
    return new;
end;
$$;

drop trigger if exists trg_clear_review_required on public.policy_acceptances;
create trigger trg_clear_review_required
    after insert on public.policy_acceptances
    for each row execute function public.clear_review_required_on_acceptance();

-- =============================================================================
-- Row Level Security
-- =============================================================================

alter table public.legal_documents enable row level security;
alter table public.policy_versions enable row level security;
alter table public.policy_acceptances enable row level security;
alter table public.policy_review_required_users enable row level security;
alter table public.audit_log_events enable row level security;
alter table public.transaction_disclosure_views enable row level security;

-- legal_documents and policy_versions are public-readable (the policy text is
-- already public on the website). Writes are restricted to service role.
create policy "Public can read legal_documents"
    on public.legal_documents for select
    using (true);

create policy "Public can read policy_versions"
    on public.policy_versions for select
    using (true);

-- Users can read their own acceptance records.
create policy "Users read own acceptances"
    on public.policy_acceptances for select
    using (auth.uid() = user_id);

-- Acceptances must be inserted via the API/edge function which runs with
-- service role; no end-user INSERT/UPDATE/DELETE policies are defined.

-- Users can read their own review-required rows.
create policy "Users read own review_required"
    on public.policy_review_required_users for select
    using (auth.uid() = user_id);

-- Users can read their own audit events. Org admins can read org events via
-- a separate organization-membership policy added in a later migration.
create policy "Users read own audit_log_events"
    on public.audit_log_events for select
    using (auth.uid() = actor_user_id);

create policy "Users read own transaction_disclosure_views"
    on public.transaction_disclosure_views for select
    using (auth.uid() = user_id);

-- =============================================================================
-- Seed: catalog the 10 legal documents (versions + bodies are added at publish).
-- =============================================================================
insert into public.legal_documents (slug, title, category, required_at_signup, requires_reaccept_on_update)
values
    ('terms',                    'Terms of Service',                                  'core',       true,  true),
    ('privacy',                  'Privacy Policy',                                    'core',       true,  true),
    ('fees',                     'Fee Disclosure Policy',                             'core',       true,  true),
    ('payment-processor',        'Payment Processor / Stripe Integration Terms',      'core',       true,  true),
    ('transaction-flow-memo',    'Transaction Flow Legal Review Memo',                'framework',  false, false),
    ('non-custodial',            'Non-Custodial & Non-Money-Transmission Disclaimer', 'disclosure', true,  true),
    ('api-data',                 'API & Third-Party Connection Disclosure',           'disclosure', true,  true),
    ('compliance-audit',         'Data Usage & Audit Logging Disclosure',             'disclosure', true,  true),
    ('identity-verification',    'Identity Verification & Compliance Disclosure',     'disclosure', true,  true),
    ('risk-liability',           'Platform Risk Allocation & Liability Limitation',   'framework',  false, false)
on conflict (slug) do nothing;
