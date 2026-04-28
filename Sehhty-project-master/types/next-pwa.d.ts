declare module "next-pwa" {
  import type { NextConfig } from "next";

  type PWAOptions = {
    dest: string;
    disable?: boolean;
    register?: boolean;
    skipWaiting?: boolean;
    runtimeCaching?: unknown[];
    [key: string]: unknown;
  };

  export default function withPWA(options: PWAOptions): (config: NextConfig) => NextConfig;
}

declare module "next-pwa/cache.js" {
  const runtimeCaching: unknown[];
  export default runtimeCaching;
}
