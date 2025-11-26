import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { renderer } from "./renderer";
import {
  HtmlHandler,
  LinkHandler,
  MetaCollector,
  MetaHandler,
  TitleHandler,
} from "./meta-collector";
import {
  MetaExtractionResultSchema,
  NonHtmlResponseSchema,
  ErrorResponseSchema,
} from "./meta-schema";

const app = new OpenAPIHono<{ Bindings: CloudflareBindings }>();

app.use(renderer);

app.get("/", (c) => {
  return c.render(<h1>Hello!</h1>);
});

const metaRoute = createRoute({
  method: "get",
  path: "/meta",
  request: {
    query: z.object({
      url: z
        .string()
        .url()
        .openapi({
          description: "メタ情報を取得したいURL",
          example: "https://example.com",
        }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.union([MetaExtractionResultSchema, NonHtmlResponseSchema]),
        },
      },
      description: "メタ情報の抽出結果",
    },
    400: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "バリデーションエラー",
    },
  },
});

app.openapi(metaRoute, async (c) => {
  const { url: urlParam } = c.req.valid("query");

  let target: URL;
  try {
    target = new URL(urlParam);
  } catch {
    return c.json({ error: "invalid url" }, 400);
  }

  if (!["http:", "https:"].includes(target.protocol)) {
    return c.json({ error: "unsupported protocol" }, 400);
  }

  const res = await fetch(target.toString(), {
    redirect: "follow",
    headers: {
      "User-Agent": "MetaProxyWorker/1.0",
    },
  });

  const status = res.status;
  const contentType = res.headers.get("content-type") ?? undefined;

  if (!contentType || !contentType.toLowerCase().includes("text/html")) {
    return c.json(
      {
        requestedUrl: target.toString(),
        finalUrl: res.url,
        status,
        contentType,
        error: "non-html response" as const,
      },
      200,
      {
        "Cache-Control": "public, max-age=300",
      }
    );
  }

  const collector = new MetaCollector(res.url);

  const rewriter = new HTMLRewriter()
    .on("html", new HtmlHandler(collector))
    .on("head > title", new TitleHandler(collector))
    .on("head meta", new MetaHandler(collector))
    .on("head link", new LinkHandler(collector));

  const rewrittenResponse = rewriter.transform(res);
  await rewrittenResponse.arrayBuffer();

  const result = collector.toResult({
    requestedUrl: target.toString(),
    finalUrl: res.url,
    status,
    contentType,
  });

  return c.json(result, 200, {
    "Cache-Control": "public, max-age=600",
    "Access-Control-Allow-Origin": "*",
  });
});

app.doc("/doc", {
  openapi: "3.0.0",
  info: {
    title: "Page Meta Proxy API",
    version: "1.0.0",
    description: "URLからメタ情報を抽出するAPI",
  },
});

export default app;
