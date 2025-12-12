import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tubegrow.io";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          // Authenticated / app-only areas (prefix matches)
          "/dashboard",
          "/command-center",
          "/videos",
          "/video",
          "/analysis",
          "/optimize",
          "/clips",
          "/deep-analysis",
          "/why-it-works",
          "/advanced-insights",
          "/settings",
          "/onboarding",
          "/admin",
          "/traffic",
          "/audience",
          "/revenue",
          "/comments",
          "/waitlist/confirm",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
