import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // هذه الإضافة تخبر Next.js بتجاهل أخطاء الـ TypeScript أثناء عملية البيلد
    ignoreBuildErrors: true,
  },
};

export default nextConfig;