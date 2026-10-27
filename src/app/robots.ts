import type { MetadataRoute } from "next";
import { env } from "@/env";

// `env.NEXT_PUBLIC_APP_URL` is the validated single source for the site origin (it falls
// back to `BETTER_AUTH_URL`), so the sitemap URL can never drift from a literal hostname.
// A trailing slash would produce `//sitemap.xml`, so normalise it away.
const siteOrigin = env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/login", "/register"],
    },
    sitemap: `${siteOrigin}/sitemap.xml`,
  };
}
