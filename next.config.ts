import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // firebase-admin pulls in `jose` (ESM-only) via jwks-rsa/google-auth-library.
  // Bundling it causes an ERR_REQUIRE_ESM crash at runtime on Vercel, so we
  // tell Next.js to leave it as a plain external require() instead.
  serverExternalPackages: ["firebase-admin"],
};

export default nextConfig;