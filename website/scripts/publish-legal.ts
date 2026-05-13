/**
 * publish-legal.ts
 *
 * Run via: `pnpm publish-legal` (or npm/yarn equivalent).
 *
 * Walks /legal-content/*.mdx, computes SHA-256 over each MDX file's bytes,
 * and upserts:
 *   1) legal_documents (one row per slug)
 *   2) policy_versions (append-only; new row on first sight of (slug, version))
 *   3) legal_documents.active_version_id (points at the highest-version row)
 *
 * Material-change fanout to policy_review_required_users is handled
 * server-side by the AFTER INSERT trigger created in
 * supabase/migrations/20260509000001_legal_compliance_schema.sql.
 *
 * This script is idempotent — safe to re-run on every deploy.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import matter from "gray-matter";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const LEGAL_DIR = path.resolve(process.cwd(), "..", "legal-content");

interface Frontmatter {
  slug: string;
  title: string;
  category: "core" | "disclosure" | "framework";
  version: string;
  effectiveDate: string;
  lastUpdated: string;
  requiredAtSignup: boolean;
  requiresReacceptOnUpdate: boolean;
  isMaterialChange?: boolean;
  visibility?: "public" | "internal";
}

async function publishOne(filePath: string) {
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = matter(raw);
  const fm = parsed.data as Frontmatter;
  const sha = crypto.createHash("sha256").update(raw, "utf8").digest("hex");

  // 1. Upsert document row.
  const { data: docRow, error: docErr } = await supabase
    .from("legal_documents")
    .upsert(
      {
        slug: fm.slug,
        title: fm.title,
        category: fm.category,
        required_at_signup: fm.requiredAtSignup,
        requires_reaccept_on_update: fm.requiresReacceptOnUpdate,
      },
      { onConflict: "slug" }
    )
    .select("id")
    .single();
  if (docErr) throw docErr;

  // 2. Insert this version if it doesn't already exist.
  const { data: existing } = await supabase
    .from("policy_versions")
    .select("id, content_sha256")
    .eq("document_id", docRow.id)
    .eq("version", fm.version)
    .maybeSingle();

  let versionId: string;
  if (existing) {
    if (existing.content_sha256 !== sha) {
      throw new Error(
        `Refusing to mutate published version ${fm.slug}@${fm.version} — content hash changed. Bump the version.`
      );
    }
    versionId = existing.id;
  } else {
    const { data: ver, error: verErr } = await supabase
      .from("policy_versions")
      .insert({
        document_id: docRow.id,
        version: fm.version,
        effective_date: fm.effectiveDate.startsWith("[") ? null : fm.effectiveDate,
        last_updated: fm.lastUpdated.startsWith("[") ? null : fm.lastUpdated,
        content_sha256: sha,
        is_material_change: !!fm.isMaterialChange,
      })
      .select("id")
      .single();
    if (verErr) throw verErr;
    versionId = ver.id;
  }

  // 3. Point active_version_id at this version.
  const { error: updErr } = await supabase
    .from("legal_documents")
    .update({ active_version_id: versionId })
    .eq("id", docRow.id);
  if (updErr) throw updErr;

  console.log(`✓ ${fm.slug}@${fm.version} (${sha.slice(0, 12)}…)`);
}

(async () => {
  const files = fs.readdirSync(LEGAL_DIR).filter((f) => f.endsWith(".mdx"));
  for (const f of files) {
    try {
      await publishOne(path.join(LEGAL_DIR, f));
    } catch (e) {
      console.error(`✗ ${f}:`, (e as Error).message);
      process.exitCode = 1;
    }
  }
})();
