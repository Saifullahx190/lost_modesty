import type { MetadataRoute } from "next";
import { absUrl } from "@/lib/site";

// robots.txt (REBUILD §3C). Read path is fully indexable; logged-in/admin surfaces
// (auth, dashboard, editor, account settings) are disallowed here AND noindex at the
// page level (REBUILD §1#3 / §4 Phase 2). Sitemap is advertised for GSC discovery.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/login", "/register", "/dashboard", "/editor", "/settings"],
      },
    ],
    sitemap: absUrl("/sitemap.xml"),
    host: absUrl("/"),
  };
}
