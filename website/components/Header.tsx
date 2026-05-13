import Link from "next/link";

export function Header() {
  return (
    <header className="site-header" role="banner">
      <Link href="/" aria-label="ConneCDNA home" style={{ color: "inherit" }}>
        <div className="brand">
          ConneCDNA
          <small>An affiliate platform of Silvermoon Capital LLC</small>
        </div>
      </Link>
      <nav aria-label="Primary">
        <Link href="/platform">Platform</Link>
        <Link href="/enterprise">Enterprise</Link>
        <Link href="/legal">Legal</Link>
      </nav>
    </header>
  );
}
