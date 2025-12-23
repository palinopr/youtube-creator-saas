import { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getAllSEOPages,
  getSEOPage,
  getRelatedSEOPages,
} from "@/lib/seo/loader";
import SEOPageRenderer from "@/components/seo/SEOPageRenderer";

interface Props {
  params: Promise<{ category: string; slug: string }>;
}

export async function generateStaticParams() {
  const pages = getAllSEOPages();
  return pages
    .filter((p) => p.status === "published")
    .map((p) => ({
      category: p.category,
      slug: p.slug,
    }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, slug } = await params;
  const page = getSEOPage(category, slug);

  if (!page) {
    return { title: "Not Found" };
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.tubegrow.io";

  return {
    title: page.metadata.title,
    description: page.metadata.description,
    keywords: page.metadata.keywords,
    alternates: {
      canonical: page.metadata.canonical || `${baseUrl}/seo/${category}/${slug}`,
    },
    openGraph: {
      title: page.metadata.title,
      description: page.metadata.description,
      url: `${baseUrl}/seo/${category}/${slug}`,
      siteName: "TubeGrow",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: page.metadata.title,
      description: page.metadata.description,
    },
  };
}

export default async function SEOPageRoute({ params }: Props) {
  const { category, slug } = await params;
  const page = getSEOPage(category, slug);

  if (!page || page.status !== "published") {
    notFound();
  }

  const relatedPages = getRelatedSEOPages(page, 6);

  // JSON-LD structured data for FAQ
  const faqSchema = page.faq.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  } : null;

  return (
    <>
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <SEOPageRenderer page={page} relatedPages={relatedPages} />
    </>
  );
}
