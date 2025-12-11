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
          "/dashboard/",
          "/videos/",
          "/video/",
          "/analysis/",
          "/optimize/",
          "/clips/",
          "/deep-analysis/",
          "/why-it-works/",
          "/advanced-insights/",
          "/settings/",
          "/onboarding/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
