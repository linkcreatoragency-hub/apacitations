// Vercel serverless function: extract citation metadata from a web page
module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate");

  const url = req.query.url;
  if (!url || !/^https?:\/\//i.test(url)) {
    return res.status(400).json({ error: "Invalid URL" });
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const r = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; APACitationsBot/1.0; +https://apacitations.com)",
        "Accept": "text/html,application/xhtml+xml"
      }
    });
    clearTimeout(timer);
    if (!r.ok) return res.status(200).json({ error: "Page returned " + r.status });

    let html = await r.text();
    html = html.slice(0, 400000);

    const meta = (name) => {
      const re1 = new RegExp('<meta[^>]+(?:name|property)=["\']' + name + '["\'][^>]+content=["\']([^"\']*)["\']', "i");
      const re2 = new RegExp('<meta[^>]+content=["\']([^"\']*)["\'][^>]+(?:name|property)=["\']' + name + '["\']', "i");
      const m = html.match(re1) || html.match(re2);
      return m ? decode(m[1].trim()) : "";
    };
    const decode = (s) =>
      s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
       .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&#x27;/gi, "'").replace(/&nbsp;/g, " ");

    let title = meta("og:title") || meta("twitter:title");
    if (!title) {
      const t = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      if (t) title = decode(t[1].trim().replace(/\s+/g, " "));
    }
    // Strip trailing " - Site Name" / " | Site Name" from <title>
    let siteName = meta("og:site_name");
    if (title && siteName && title.includes(siteName)) {
      title = title.replace(new RegExp("\\s*[\\|\\-–—:]\\s*" + siteName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*$"), "");
    }
    if (!siteName) {
      try { siteName = new URL(url).hostname.replace(/^www\./, ""); } catch (e) {}
    }

    const author = meta("author") || meta("article:author") || meta("parsely-author") || "";
    const dateRaw = meta("article:published_time") || meta("og:published_time") ||
                    meta("datePublished") || meta("date") || meta("parsely-pub-date") || "";

    let year = 0, month = 0, day = 0;
    const dm = dateRaw.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (dm) { year = +dm[1]; month = +dm[2]; day = +dm[3]; }
    else {
      const ym = dateRaw.match(/(\d{4})/);
      if (ym) year = +ym[1];
    }

    return res.status(200).json({
      title: title || "",
      siteName: siteName || "",
      author: /^https?:\/\//.test(author) ? "" : author,
      year, month, day
    });
  } catch (e) {
    return res.status(200).json({ error: "Fetch failed" });
  }
};
