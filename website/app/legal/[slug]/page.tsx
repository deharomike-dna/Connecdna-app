import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote/rsc";
import { loadAllLegalDocuments, loadLegalDocument } from "@/lib/legal";

interface Params {
  slug: string;
}

export async function generateStaticParams(): Promise<Params[]> {
  return loadAllLegalDocuments().map((d) => ({ slug: d.meta.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const doc = loadLegalDocument(params.slug);
  if (!doc) return { title: "Legal" };
  return {
    title: doc.meta.title,
    description: `${doc.meta.title} — ConneCDNA, an affiliate platform of Silvermoon Capital LLC. Version ${doc.meta.version}, effective ${doc.meta.effectiveDate}.`,
  };
}

export default function LegalDocumentPage({ params }: { params: Params }) {
  const doc = loadLegalDocument(params.slug);
  if (!doc) return notFound();
  if (doc.meta.visibility === "internal") return notFound();

  return (
    <article className="legal-shell">
      <div className="doc-meta" aria-label="Document metadata">
        <span><strong>Category</strong><br />{doc.meta.category}</span>
        <span><strong>Version</strong><br />{doc.meta.version}</span>
        <span><strong>Effective</strong><br />{doc.meta.effectiveDate}</span>
        <span><strong>Last updated</strong><br />{doc.meta.lastUpdated}</span>
        <span><strong>Owner</strong><br />{doc.meta.parentEntity}</span>
        <span><strong>Governing law</strong><br />{doc.meta.governingLaw}</span>
      </div>
      <MDXRemote source={doc.body} />
      <hr style={{ borderColor: "var(--rule)", margin: "48px 0 16px" }} />
      <p style={{ fontSize: "0.78rem", color: "var(--fg-muted)" }}>
        Document SHA-256: <code>{doc.contentSha256}</code>
      </p>
    </article>
  );
}
