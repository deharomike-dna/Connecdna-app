import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ConneCDNA — Software Infrastructure for Workflow Orchestration",
    template: "%s | ConneCDNA",
  },
  description:
    "ConneCDNA is a software platform owned and licensed by Silvermoon Capital LLC. Workflow orchestration, verification, identity continuity, and audit infrastructure for healthcare, finance, logistics, government, and enterprise.",
  applicationName: "ConneCDNA",
  authors: [{ name: "Silvermoon Capital LLC" }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
