import { SELF } from "cloudflare:test";
import { describe, it, expect } from "vitest";

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
    const res = await SELF.fetch(
      "http://localhost/meta?url=ftp://example.com"
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json).toEqual({ error: "unsupported protocol" });
  });

  it("extracts meta from a real website", async () => {
    const res = await SELF.fetch(
      "http://localhost/meta?url=https://example.com"
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      requestedUrl: string;
      finalUrl: string;
      status: number;
      title?: string;
    };

    expect(json.requestedUrl).toBe("https://example.com/");
    expect(json.status).toBe(200);
    expect(json.title).toBe("Example Domain");
  });

  it("extracts OG tags from a website with rich meta", async () => {
    const res = await SELF.fetch(
      "http://localhost/meta?url=https://github.com"
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      requestedUrl: string;
      og: Record<string, string>;
      twitter: Record<string, string>;
      metaByName: Record<string, string>;
    };

    expect(json.og).toBeDefined();
    expect(json.twitter).toBeDefined();
    expect(json.metaByName).toBeDefined();
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
