/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // We render MDX from the shared /legal-content directory at the repo root
  // via next-mdx-remote (see app/legal/[slug]/page.tsx).
};

export default nextConfig;
