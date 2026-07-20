import type { MetadataRoute } from "next";
import { headers } from "next/headers";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const h = await headers();
  const host = h.get("host") || "www.digitalinvitestudio.com";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/dashboard",
        "/login",
        "/reset-password",
        "/invite/",
        "/rsvp/",
        "/guestbook/",
        "/seating/",
        "/moments/",
        "/live-wall/",
        "/preview/",
      ],
    },
    sitemap: `https://${host}/sitemap.xml`,
  };
}
