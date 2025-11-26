import { SELF, fetchMock } from "cloudflare:test";
import { describe, it, expect, beforeAll, afterEach } from "vitest";

// Enable fetch mock
beforeAll(() => {
  fetchMock.activate();
  fetchMock.disableNetConnect();
});

afterEach(() => {
  fetchMock.assertNoPendingInterceptors();
});

describe("GET /meta", () => {
  it("returns validation error when url parameter is missing", async () => {
    const res = await SELF.fetch("http://localhost/meta");
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json).toHaveProperty("success", false);
  });

  it("returns validation error for invalid url format", async () => {
    const res = await SELF.fetch("http://localhost/meta?url=not-a-url");
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json).toHaveProperty("success", false);
  });

  it("returns error for unsupported protocol", async () => {
    const res = await SELF.fetch("http://localhost/meta?url=ftp://example.com");
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json).toEqual({ error: "unsupported protocol" });
  });

  it("returns error for recursive request", async () => {
    const res = await SELF.fetch("http://localhost/meta?url=https://example.com", {
      headers: {
        "X-Meta-Proxy-Request": "1",
      },
    });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json).toEqual({ error: "recursive request detected" });
  });

  it("extracts title and lang from HTML", async () => {
    fetchMock
      .get("https://example.com")
      .intercept({ path: "/" })
      .reply(
        200,
        `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Test Page Title</title>
  <meta name="description" content="Test description">
</head>
<body></body>
</html>`,
        { headers: { "content-type": "text/html; charset=utf-8" } },
      );

    const res = await SELF.fetch("http://localhost/meta?url=https://example.com/");
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      title?: string;
      lang?: string;
      description?: string;
      charset?: string;
    };

    expect(json.title).toBe("Test Page Title");
    expect(json.lang).toBe("en");
    expect(json.description).toBe("Test description");
    expect(json.charset).toBe("UTF-8");
  });

  it("extracts OG and Twitter meta tags", async () => {
    fetchMock
      .get("https://example.com")
      .intercept({ path: "/" })
      .reply(
        200,
        `<!DOCTYPE html>
<html>
<head>
  <meta property="og:title" content="OG Title">
  <meta property="og:description" content="OG Description">
  <meta property="og:image" content="https://example.com/image.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Twitter Title">
</head>
<body></body>
</html>`,
        { headers: { "content-type": "text/html" } },
      );

    const res = await SELF.fetch("http://localhost/meta?url=https://example.com/");
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      og: Record<string, string>;
      twitter: Record<string, string>;
      description?: string;
    };

    expect(json.og.title).toBe("OG Title");
    expect(json.og.description).toBe("OG Description");
    expect(json.og.image).toBe("https://example.com/image.png");
    expect(json.twitter.card).toBe("summary_large_image");
    expect(json.twitter.title).toBe("Twitter Title");
    // description should fallback to og:description
    expect(json.description).toBe("OG Description");
  });

  it("extracts canonical and icons", async () => {
    fetchMock
      .get("https://example.com")
      .intercept({ path: "/" })
      .reply(
        200,
        `<!DOCTYPE html>
<html>
<head>
  <link rel="canonical" href="https://example.com/canonical-page">
  <link rel="icon" href="/favicon.ico">
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
</head>
<body></body>
</html>`,
        { headers: { "content-type": "text/html" } },
      );

    const res = await SELF.fetch("http://localhost/meta?url=https://example.com/");
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      canonical?: string;
      favicon?: string;
      icons: Array<{ href: string; rel: string; sizes?: string }>;
    };

    expect(json.canonical).toBe("https://example.com/canonical-page");
    expect(json.favicon).toBe("https://example.com/favicon.ico");
    expect(json.icons).toHaveLength(2);
    expect(json.icons[0]).toEqual({
      href: "https://example.com/favicon.ico",
      rel: "icon",
      type: undefined,
      sizes: undefined,
    });
    expect(json.icons[1]).toEqual({
      href: "https://example.com/apple-touch-icon.png",
      rel: "apple-touch-icon",
      type: undefined,
      sizes: "180x180",
    });
  });

  it("extracts alternate links (hreflang and feeds)", async () => {
    fetchMock
      .get("https://example.com")
      .intercept({ path: "/" })
      .reply(
        200,
        `<!DOCTYPE html>
<html>
<head>
  <link rel="alternate" hreflang="ja" href="https://example.com/ja/">
  <link rel="alternate" hreflang="en" href="https://example.com/en/">
  <link rel="alternate" type="application/rss+xml" title="RSS Feed" href="/feed.xml">
</head>
<body></body>
</html>`,
        { headers: { "content-type": "text/html" } },
      );

    const res = await SELF.fetch("http://localhost/meta?url=https://example.com/");
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      alternates: Array<{ href: string; hreflang?: string; type?: string; title?: string }>;
    };

    expect(json.alternates).toHaveLength(3);
    expect(json.alternates[0]).toEqual({
      href: "https://example.com/ja/",
      hreflang: "ja",
      type: undefined,
      title: undefined,
    });
    expect(json.alternates[1]).toEqual({
      href: "https://example.com/en/",
      hreflang: "en",
      type: undefined,
      title: undefined,
    });
    expect(json.alternates[2]).toEqual({
      href: "https://example.com/feed.xml",
      hreflang: undefined,
      type: "application/rss+xml",
      title: "RSS Feed",
    });
  });

  it("extracts additional meta fields (author, keywords, robots, generator, theme-color)", async () => {
    fetchMock
      .get("https://example.com")
      .intercept({ path: "/" })
      .reply(
        200,
        `<!DOCTYPE html>
<html>
<head>
  <meta name="author" content="John Doe">
  <meta name="keywords" content="test, example, meta">
  <meta name="robots" content="index, follow">
  <meta name="generator" content="My CMS 1.0">
  <meta name="theme-color" content="#ffffff">
</head>
<body></body>
</html>`,
        { headers: { "content-type": "text/html" } },
      );

    const res = await SELF.fetch("http://localhost/meta?url=https://example.com/");
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      author?: string;
      keywords?: string;
      robots?: string;
      generator?: string;
      themeColor?: string;
    };

    expect(json.author).toBe("John Doe");
    expect(json.keywords).toBe("test, example, meta");
    expect(json.robots).toBe("index, follow");
    expect(json.generator).toBe("My CMS 1.0");
    expect(json.themeColor).toBe("#ffffff");
  });

  it("returns non-html response error for non-HTML content", async () => {
    fetchMock
      .get("https://example.com")
      .intercept({ path: "/api/data" })
      .reply(200, '{"data": "test"}', {
        headers: { "content-type": "application/json" },
      });

    const res = await SELF.fetch("http://localhost/meta?url=https://example.com/api/data");
    expect(res.status).toBe(200);
    const json = (await res.json()) as { error?: string };

    expect(json.error).toBe("non-html response");
  });

  it("resolves relative URLs to absolute URLs", async () => {
    fetchMock
      .get("https://example.com")
      .intercept({ path: "/page" })
      .reply(
        200,
        `<!DOCTYPE html>
<html>
<head>
  <link rel="canonical" href="/page">
  <link rel="icon" href="favicon.ico">
  <meta property="og:image" content="../images/og.png">
</head>
<body></body>
</html>`,
        { headers: { "content-type": "text/html" } },
      );

    const res = await SELF.fetch("http://localhost/meta?url=https://example.com/page");
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      canonical?: string;
      favicon?: string;
      og: Record<string, string>;
    };

    expect(json.canonical).toBe("https://example.com/page");
    // favicon.ico relative to /page resolves to /favicon.ico (sibling, not child)
    expect(json.favicon).toBe("https://example.com/favicon.ico");
    // Note: og:image is stored as-is in the og map (not resolved)
    expect(json.og.image).toBe("../images/og.png");
  });
});

describe("GET /", () => {
  it("returns HTML response", async () => {
    const res = await SELF.fetch("http://localhost/");
    expect(res.status).toBe(200);
    const contentType = res.headers.get("content-type");
    expect(contentType).toContain("text/html");
  });
});

describe("GET /doc", () => {
  it("returns OpenAPI spec", async () => {
    const res = await SELF.fetch("http://localhost/doc");
    expect(res.status).toBe(200);
    const json = (await res.json()) as { openapi: string; info: { title: string } };
    expect(json.openapi).toBe("3.0.0");
    expect(json.info.title).toBe("Page Meta Proxy API");
  });
});
