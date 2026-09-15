import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Works around a Turbopack bug where @react-email/render's prettier
  // dependency gets externalized with a hashed name that doesn't resolve at
  // runtime. See https://github.com/resend/react-email/issues/2426 and
  // https://github.com/vercel/next.js/issues/87737.
  serverExternalPackages: ["prettier"],
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
