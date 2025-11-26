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
  requestedUrl: z.string().openapi({ description: "クライアントから指定されたURL" }),
  finalUrl: z.string().openapi({ description: "実際に取得に使ったURL（リダイレクト後など）" }),
  status: z.number().openapi({ description: "HTTPステータスコード" }),
  contentType: z.string().optional().openapi({ description: "Content-Type" }),
  lang: z.string().optional().openapi({ description: '<html lang="...">の値' }),
  title: z.string().optional().openapi({ description: "<head><title>の内容" }),
  canonical: z.string().optional().openapi({ description: '<link rel="canonical">のhref' }),
  og: z
    .record(z.string(), z.string())
    .openapi({ description: 'og:* プロパティ（og:title → { title: "..." }）' }),
  twitter: z.record(z.string(), z.string()).openapi({ description: "twitter:* プロパティ" }),
  metaByName: z
    .record(z.string(), z.string())
    .openapi({ description: "meta[name=*] のマップ（小文字化）" }),
  metaByProperty: z
    .record(z.string(), z.string())
    .openapi({ description: "meta[property=*] のマップ（小文字化）" }),
  metaTags: z.array(MetaTagSchema).openapi({ description: "生メタタグ全部" }),
  linkTags: z.array(LinkTagSchema).openapi({ description: "<link>タグ全部" }),
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
