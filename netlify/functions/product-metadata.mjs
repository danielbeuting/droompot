function decodeHtml(value = "") {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\\u002F/g, "/")
    .replace(/\\u0026/g, "&")
    .replace(/\\\//g, "/");
}

function pickMeta(html, keys) {
  for (const key of keys) {
    const patterns = [
      new RegExp(`<meta[^>]+property=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${key}["'][^>]*>`, "i"),
      new RegExp(`<meta[^>]+name=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${key}["'][^>]*>`, "i"),
    ];
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match?.[1]) return decodeHtml(match[1]);
    }
  }
  return "";
}

function pageTitle(html) {
  return pickMeta(html, ["og:title", "twitter:title"]) ||
    decodeHtml(html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() || "");
}

function imageSrcLink(html) {
  const patterns = [
    /<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i,
    /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']image_src["']/i,
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m?.[1]) return decodeHtml(m[1]);
  }
  return "";
}

function jsonLdProduct(html) {
  const scripts = [...html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  )];

  const candidates = [];
  for (const match of scripts) {
    const raw = match[1]?.trim();
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        if (item?.["@graph"] && Array.isArray(item["@graph"])) {
          candidates.push(...item["@graph"]);
        } else {
          candidates.push(item);
        }
      }
    } catch {}
  }

  const product = candidates.find(item => {
    const type = item?.["@type"];
    return type === "Product" || (Array.isArray(type) && type.includes("Product"));
  });

  if (!product) return {};

  let image = product.image;
  if (Array.isArray(image)) image = image[0];
  if (image && typeof image === "object") image = image.url || image.contentUrl || "";

  let price = "";
  const offers = product.offers;
  if (Array.isArray(offers) && offers[0]) {
    price = offers[0].price || offers[0].lowPrice || "";
  } else if (offers && typeof offers === "object") {
    price = offers.price || offers.lowPrice || "";
  }

  return {
    title: typeof product.name === "string" ? product.name : "",
    image: typeof image === "string" ? decodeHtml(image) : "",
    price: price ? String(price) : "",
    ean:
      product.gtin13 ||
      product.gtin ||
      product.ean ||
      product.sku ||
      "",
  };
}

function bolMediaImage(html) {
  // Bol commonly serves product media from media.s-bol.com.
  const normalized = decodeHtml(html);

  const patterns = [
    /(https:\/\/media\.s-bol\.com\/[^"'<>\\\s]+?\.(?:jpg|jpeg|png|webp)(?:\?[^"'<>\\\s]*)?)/i,
    /"(?:imageUrl|imageURL|primaryImage|image)"\s*:\s*"(https:\/\/media\.s-bol\.com\/[^"]+)"/i,
    /"url"\s*:\s*"(https:\/\/media\.s-bol\.com\/[^"]+)"/i,
  ];

  for (const p of patterns) {
    const m = normalized.match(p);
    if (m?.[1]) return decodeHtml(m[1]);
  }
  return "";
}

function extractEan(url, html) {
  // First use structured product data.
  const ld = jsonLdProduct(html);
  const fromLd = String(ld.ean || "").match(/\b\d{8,14}\b/)?.[0];
  if (fromLd) return fromLd;

  // Sometimes EAN/GTIN is embedded in application state.
  const normalized = decodeHtml(html);
  const patterns = [
    /"(?:ean|EAN|gtin13|gtin)"\s*:\s*"(\d{8,14})"/i,
    /\bEAN\b[^0-9]{0,20}(\d{8,14})/i,
  ];
  for (const p of patterns) {
    const m = normalized.match(p);
    if (m?.[1]) return m[1];
  }
  return "";
}


function extractPrice(html) {
  const ld = jsonLdProduct(html);
  if (ld.price) return String(ld.price).replace(",", ".");

  const metaCandidates = [
    "product:price:amount",
    "og:price:amount",
    "product:price",
  ];
  const metaPrice = pickMeta(html, metaCandidates);
  if (metaPrice) return String(metaPrice).replace(",", ".");

  const normalized = decodeHtml(html);
  const patterns = [
    /"(?:price|currentPrice|sellingPrice|salesPrice|offerPrice)"\s*:\s*"?([0-9]+(?:[.,][0-9]{1,2})?)"?/i,
    /€\s*([0-9]+(?:[.,][0-9]{1,2})?)/i,
    /([0-9]+(?:[.,][0-9]{1,2})?)\s*€/i,
  ];

  for (const pattern of patterns) {
    const m = normalized.match(pattern);
    if (m?.[1]) return String(m[1]).replace(",", ".");
  }

  return "";
}

async function directMetadata(url) {
  const response = await fetch(url, {
    redirect: "follow",
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/152 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml",
      "Accept-Language": "nl-NL,nl;q=0.9,en;q=0.8",
      "Cache-Control": "no-cache",
    },
  });

  if (!response.ok) throw new Error(`Page fetch ${response.status}`);
  const html = await response.text();

  const ld = jsonLdProduct(html);
  const image =
    pickMeta(html, ["og:image", "og:image:secure_url", "twitter:image", "twitter:image:src"]) ||
    ld.image ||
    imageSrcLink(html) ||
    bolMediaImage(html);

  return {
    title: pageTitle(html) || ld.title || "",
    image,
    price: extractPrice(html),
    ean: extractEan(url, html),
    status: response.status,
  };
}

async function microlinkFallback(url) {
  const endpoint =
    `https://api.microlink.io/?url=${encodeURIComponent(url)}` +
    `&filter=title,image.url&meta=true`;
  const response = await fetch(endpoint, {
    headers: { "User-Agent": "Droompot/1.2.1" },
  });
  if (!response.ok) return {};
  const json = await response.json();
  return {
    title: json?.data?.title || "",
    image: json?.data?.image?.url || "",
  };
}

export default async (req) => {
  const requestUrl = new URL(req.url);
  const url = requestUrl.searchParams.get("url");

  if (!url || !/^https?:\/\//i.test(url)) {
    return Response.json({ error: "Invalid URL" }, { status: 400 });
  }

  let direct = {};
  try {
    direct = await directMetadata(url);
  } catch {}

  // Direct extraction now tries OpenGraph, Twitter, JSON-LD, image_src,
  // and a bol-specific media.s-bol.com extraction.
  if (direct.image) {
    return Response.json({
      title: direct.title || "",
      image: direct.image,
      price: direct.price || "",
      ean: direct.ean || "",
      source: "page",
    });
  }

  let fallback = {};
  try {
    fallback = await microlinkFallback(url);
  } catch {}

  if (fallback.image || fallback.title) {
    return Response.json({
      ...fallback,
      price: direct.price || "",
      ean: direct.ean || "",
      source: "fallback",
    });
  }

  return Response.json({
    title: direct.title || "",
    image: "",
    price: direct.price || "",
    ean: direct.ean || "",
    source: "none",
    note:
      "De webshop blokkeert mogelijk geautomatiseerde metadata. Gebruik in dat geval de emoji-fallback of voeg later een officiële product-API toe.",
  });
};
