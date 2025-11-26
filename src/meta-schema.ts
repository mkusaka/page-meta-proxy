import { z } from "@hono/zod-openapi";

export const MetaTagSchema = z.object({
  name: z.string().optional(),
  property: z.string().optional(),
  httpEquiv: z.string().optional(),
  charset: z.string().optional(),
  content: z.string().optional(),
});

export const LinkTagSchema = z.object({
  rels: z.array(z.string()),
  href: z.string().optional(),
  hreflang: z.string().optional(),
  type: z.string().optional(),
  sizes: z.string().optional(),
});

export const IconSchema = z.object({
  href: z.string().openapi({ description: "Icon URL (resolved to absolute)" }),
  rel: z.string().openapi({ description: "Rel type (icon, apple-touch-icon, etc.)" }),
  type: z.string().optional().openapi({ description: "MIME type" }),
  sizes: z.string().optional().openapi({ description: 'Size (e.g., "16x16", "32x32")' }),
});

export const AlternateSchema = z.object({
  href: z.string().openapi({ description: "Alternate URL" }),
  hreflang: z.string().optional().openapi({ description: "Language code" }),
  type: z.string().optional().openapi({ description: "MIME type (e.g., application/rss+xml)" }),
  title: z.string().optional().openapi({ description: "Title (for feeds)" }),
});

export const MetaExtractionResultSchema = z.object({
  requestedUrl: z.string().openapi({ description: "URL specified by the client" }),
  finalUrl: z.string().openapi({ description: "Actual URL used for fetching (after redirects)" }),
  status: z.number().openapi({ description: "HTTP status code" }),
  contentType: z.string().optional().openapi({ description: "Content-Type" }),

  // Normalized fields
  lang: z.string().optional().openapi({ description: 'Value of <html lang="...">' }),
  title: z.string().optional().openapi({ description: "Content of <head><title>" }),
  description: z
    .string()
    .optional()
    .openapi({ description: "Page description (meta[name=description] or og:description)" }),
  canonical: z.string().optional().openapi({ description: 'href of <link rel="canonical">' }),
  charset: z.string().optional().openapi({ description: "Character encoding (meta[charset])" }),
  themeColor: z
    .string()
    .optional()
    .openapi({ description: "Theme color (meta[name=theme-color])" }),
  author: z.string().optional().openapi({ description: "Author (meta[name=author])" }),
  keywords: z.string().optional().openapi({ description: "Keywords (meta[name=keywords])" }),
  robots: z.string().optional().openapi({ description: "Robots directive (meta[name=robots])" }),
  generator: z.string().optional().openapi({ description: "Generator (meta[name=generator])" }),
  favicon: z.string().optional().openapi({ description: 'Primary favicon URL (link[rel="icon"])' }),

  // Structured normalized fields
  icons: z
    .array(IconSchema)
    .openapi({ description: "All icon links (favicon, apple-touch-icon, etc.)" }),
  alternates: z
    .array(AlternateSchema)
    .openapi({ description: "Alternate links (hreflang, feeds)" }),

  // OG/Twitter
  og: z
    .record(z.string(), z.string())
    .openapi({ description: 'og:* properties (og:title → { title: "..." })' }),
  twitter: z.record(z.string(), z.string()).openapi({ description: "twitter:* properties" }),

  // Raw collections
  metaByName: z
    .record(z.string(), z.string())
    .openapi({ description: "Map of meta[name=*] (lowercased)" }),
  metaByProperty: z
    .record(z.string(), z.string())
    .openapi({ description: "Map of meta[property=*] (lowercased)" }),
  metaTags: z.array(MetaTagSchema).openapi({ description: "All raw meta tags" }),
  linkTags: z.array(LinkTagSchema).openapi({ description: "All <link> tags" }),
});

export const NonHtmlResponseSchema = z.object({
  requestedUrl: z.string(),
  finalUrl: z.string(),
  status: z.number(),
  contentType: z.string().optional(),
  error: z.literal("non-html response"),
});

export const ErrorResponseSchema = z.object({
  error: z.string(),
});

export type MetaTag = z.infer<typeof MetaTagSchema>;
export type LinkTag = z.infer<typeof LinkTagSchema>;
export type Icon = z.infer<typeof IconSchema>;
export type Alternate = z.infer<typeof AlternateSchema>;
export type MetaExtractionResult = z.infer<typeof MetaExtractionResultSchema>;
