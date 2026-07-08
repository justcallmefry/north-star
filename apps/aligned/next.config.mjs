/** @type {import('next').NextConfig} */
export default function nextConfig(phase) {
  return {
    env: {
      // Expose build phase so pages can avoid redirect() during "Collecting page data" on Vercel
      NEXT_PUBLIC_BUILD_PHASE: phase ?? process.env.NEXT_PHASE ?? "",
    },
    // Include Prisma engine in serverless bundle (Vercel uses rhel-openssl-3.0.x)
    outputFileTracingIncludes: {
      "/**": ["./generated/prisma/**", "./node_modules/.prisma/client/**"],
    },
    async headers() {
      return [
        {
          // Apple's CDN requires the AASA file (extensionless) to be served
          // as application/json for Universal Links to validate.
          source: "/.well-known/apple-app-site-association",
          headers: [{ key: "Content-Type", value: "application/json" }],
        },
      ];
    },
  };
}
