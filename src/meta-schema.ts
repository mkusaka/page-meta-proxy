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

export const MetaExtractionResultSchema = z.object({
  requestedUrl: z.string().openapi({ description: "URL specified by the client" }),
  finalUrl: z.string().openapi({ description: "Actual URL used for fetching (after redirects)" }),
  status: z.number().openapi({ description: "HTTP status code" }),
  contentType: z.string().optional().openapi({ description: "Content-Type" }),
  lang: z.string().optional().openapi({ description: 'Value of <html lang="...">' }),
  title: z.string().optional().openapi({ description: "Content of <head><title>" }),
  canonical: z.string().optional().openapi({ description: 'href of <link rel="canonical">' }),
  og: z
    .record(z.string(), z.string())
    .openapi({ description: 'og:* properties (og:title → { title: "..." })' }),
  twitter: z.record(z.string(), z.string()).openapi({ description: "twitter:* properties" }),
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
export type MetaExtractionResult = z.infer<typeof MetaExtractionResultSchema>;
