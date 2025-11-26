import type { LinkTag, MetaExtractionResult, MetaTag } from "./meta-schema";

export class MetaCollector {
  private readonly baseUrl: string;

  private lang?: string;
  private titleBuffer: string[] = [];
  private canonical?: string;

  private readonly metaTags: MetaTag[] = [];
  private readonly linkTags: LinkTag[] = [];

  private readonly og: Record<string, string> = {};
  private readonly twitter: Record<string, string> = {};
  private readonly metaByName: Record<string, string> = {};
  private readonly metaByProperty: Record<string, string> = {};

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setLang(lang?: string | null) {
    if (!lang) return;
    if (!this.lang) {
      this.lang = lang;
    }
  }

  appendTitleChunk(text: string) {
    if (!text) return;
    this.titleBuffer.push(text);
  }

  setCanonical(href?: string | null) {
    if (!href) return;
    if (this.canonical) return;

    const resolved = this.resolveUrl(href);
    if (resolved) {
      this.canonical = resolved;
    }
  }

  addMeta(tag: MetaTag) {
    this.metaTags.push(tag);

    const content = tag.content ?? "";

    if (tag.name) {
      const nameKey = tag.name.toLowerCase();
      this.metaByName[nameKey] = content;

      if (nameKey.startsWith("twitter:")) {
        const tKey = nameKey.slice("twitter:".length);
        if (tKey) {
          this.twitter[tKey] = content;
        }
      }
    }

    if (tag.property) {
      const propKey = tag.property.toLowerCase();
      this.metaByProperty[propKey] = content;

      if (propKey.startsWith("og:")) {
        const ogKey = propKey.slice("og:".length);
        if (ogKey) {
          this.og[ogKey] = content;
        }
      }
    }
  }

  addLink(tag: LinkTag) {
    this.linkTags.push(tag);

    const relSet = new Set(tag.rels.map((r) => r.toLowerCase()));

    if (relSet.has("canonical") && tag.href) {
      this.setCanonical(tag.href);
    }
  }

  toResult(input: {
    requestedUrl: string;
    finalUrl?: string;
    status: number;
    contentType?: string;
  }): MetaExtractionResult {
    const title = this.titleBuffer.join("").trim();

    return {
      requestedUrl: input.requestedUrl,
      finalUrl: input.finalUrl ?? input.requestedUrl,
      status: input.status,
      contentType: input.contentType,

      lang: this.lang,
      title: title || undefined,
      canonical: this.canonical,

      og: this.og,
      twitter: this.twitter,
      metaByName: this.metaByName,
      metaByProperty: this.metaByProperty,

      metaTags: this.metaTags,
      linkTags: this.linkTags,
    };
  }

  private resolveUrl(href: string): string | undefined {
    try {
      return new URL(href, this.baseUrl).toString();
    } catch {
      return undefined;
    }
  }
}

export class HtmlHandler implements HTMLRewriterElementContentHandlers {
  constructor(private readonly collector: MetaCollector) {}

  element(e: Element) {
    const lang = e.getAttribute("lang");
    this.collector.setLang(lang);
  }
}

export class TitleHandler implements HTMLRewriterElementContentHandlers {
  constructor(private readonly collector: MetaCollector) {}

  text(t: Text) {
    this.collector.appendTitleChunk(t.text);
  }
}

export class MetaHandler implements HTMLRewriterElementContentHandlers {
  constructor(private readonly collector: MetaCollector) {}

  element(e: Element) {
    const tag: MetaTag = {
      name: e.getAttribute("name") ?? undefined,
      property: e.getAttribute("property") ?? undefined,
      httpEquiv: e.getAttribute("http-equiv") ?? undefined,
      charset: e.getAttribute("charset") ?? undefined,
      content: e.getAttribute("content") ?? undefined,
    };

    this.collector.addMeta(tag);
  }
}

export class LinkHandler implements HTMLRewriterElementContentHandlers {
  constructor(private readonly collector: MetaCollector) {}

  element(e: Element) {
    const relAttr = e.getAttribute("rel") ?? "";
    const rels = relAttr
      .split(/\s+/)
      .map((r) => r.trim())
      .filter(Boolean);

    if (rels.length === 0) {
      return;
    }

    const tag: LinkTag = {
      rels,
      href: e.getAttribute("href") ?? undefined,
      hreflang: e.getAttribute("hreflang") ?? undefined,
      type: e.getAttribute("type") ?? undefined,
      sizes: e.getAttribute("sizes") ?? undefined,
    };

    this.collector.addLink(tag);
  }
}
