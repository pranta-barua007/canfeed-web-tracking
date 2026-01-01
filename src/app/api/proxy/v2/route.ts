import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";

async function handleRequest(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  try {
    const targetUrlObj = new URL(targetUrl);
    const targetOrigin = targetUrlObj.origin;
    const myOrigin = req.nextUrl.origin;

    // 1. Prepare Request Headers
    const requestHeaders: Record<string, string> = {
      "X-Forwarded-For": req.headers.get("x-forwarded-for") || (req as unknown as { ip?: string }).ip || "127.0.0.1",
    };

    const headersToForward = [
      "accept",
      "accept-language",
      "cache-control",
      "pragma",
      "sec-ch-ua",
      "sec-ch-ua-mobile",
      "sec-ch-ua-platform",
      "user-agent",
      "cookie",
    ];

    headersToForward.forEach(header => {
      const value = req.headers.get(header);
      if (value) requestHeaders[header] = value;
    });

    // Match origin/referer to target
    requestHeaders["Referer"] = targetOrigin;
    requestHeaders["Origin"] = targetOrigin;

    // 2. Handle POST Body
    let body = null;
    if (req.method === "POST") {
      try {
        const arrayBuffer = await req.arrayBuffer();
        if (arrayBuffer.byteLength > 0) {
          body = Buffer.from(arrayBuffer);
          requestHeaders["content-type"] = req.headers.get("content-type") || "application/json";
          requestHeaders["content-length"] = body.length.toString();
        }
      } catch (e) {
        console.warn("[Proxy] Body read error:", e);
      }
    }

    // 3. Fetch from Target
    const response = await axios({
      method: req.method,
      url: targetUrl,
      headers: requestHeaders,
      data: body,
      responseType: "arraybuffer",
      validateStatus: () => true,
    });

    // 4. Prepare Response Headers
    const contentType = response.headers["content-type"] || "";
    const responseHeaders = new Headers();

    const headersToReturn = ["content-type", "cache-control", "last-modified", "etag", "set-cookie"];
    headersToReturn.forEach(header => {
      if (response.headers[header]) {
        const val = response.headers[header];
        if (Array.isArray(val)) {
          val.forEach(v => responseHeaders.append(header, v));
        } else {
          responseHeaders.set(header, val);
        }
      }
    });

    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    responseHeaders.set("Access-Control-Allow-Headers", "*");

    const status = response.status;
    const noBodyStatus = [204, 205, 304];

    // Guard against NextResponse crash on 204
    if (noBodyStatus.includes(status)) {
      return new Response(null, { status, headers: responseHeaders });
    }

    // 5. Handle Content Types
    const isScript = targetUrl.match(/\.(js|mjs)($|\?)/);

    // SURGICAL SCRIPT SPOOFING
    if (isScript) {
      if (contentType.includes("text/html") || status >= 400) {
        return new Response(
          `console.error("[CanFeed Proxy] Script error: ${targetUrl} (${status})");`,
          { status: 200, headers: { "Content-Type": "application/javascript", "Access-Control-Allow-Origin": "*" } }
        );
      }
      if (targetUrl.includes('cookiebot.com') || targetUrl.includes('googletagmanager.com') || targetUrl.includes('google-analytics.com')) {
        let js = Buffer.from(response.data).toString('utf-8');
        js = js.replace(/window\.location\.hostname/g, JSON.stringify(targetUrlObj.hostname));
        js = js.replace(/location\.hostname/g, JSON.stringify(targetUrlObj.hostname));
        return new Response(js, { status: 200, headers: responseHeaders });
      }
      return new Response(response.data, { status: 200, headers: responseHeaders });
    }

    // HTML REWRITING
    if (contentType.includes("text/html")) {
      const html = Buffer.from(response.data).toString("utf-8");
      const $ = cheerio.load(html);

      $('meta[http-equiv="Content-Security-Policy"]').remove();
      $('meta[http-equiv="X-Frame-Options"]').remove();

      let baseUrl = targetUrl;
      const existingBase = $('base[href]').first().attr('href');
      if (existingBase) {
        baseUrl = new URL(existingBase, targetUrl).href;
        $('base').remove();
      }

      const toAbsolute = (p: string) => new URL(p, baseUrl).href;
      const toProxy = (p: string) => {
        const abs = toAbsolute(p);
        let url = `${myOrigin}/api/proxy/v2?url=${encodeURIComponent(abs)}`;
        if (abs.includes("/_next/")) url += "&__next_bypass=/_next/";
        return url;
      };

      $('head').prepend(`<base href="${baseUrl}">`);

      $('link[href], script[src]').each((_, el) => {
        const attr = el.tagName === 'link' ? 'href' : 'src';
        const val = $(el).attr(attr);
        if (val && !val.startsWith('data:') && !val.startsWith(targetUrl)) {
          $(el).attr(attr, toProxy(val));
        }
      });

      $('img[src], video[src], audio[src], source[src], track[src], object[data], embed[src], iframe[src]').each((_, el) => {
        const attr = el.tagName === 'object' ? 'data' : 'src';
        const val = $(el).attr(attr);
        if (val && !val.startsWith('data:')) {
          $(el).attr(attr, toAbsolute(val));
          if (el.tagName === 'img') $(el).attr('referrerpolicy', 'no-referrer');
        }
      });

      $('link[rel*="font"], link[as="font"]').each((_, el) => {
        const val = $(el).attr('href');
        if (val) $(el).attr('href', toProxy(val));
      });

      const interceptorCode = `
(function() {
  var REAL_ORIGIN = ${JSON.stringify(myOrigin)};
  var PROXY_ENDPOINT = REAL_ORIGIN + '/api/proxy/v2';
  var TARGET_ORIGIN = ${JSON.stringify(targetOrigin)};
  var BASE_URL = ${JSON.stringify(baseUrl)};

  var toProxy = function(url) {
    if (!url || typeof url !== 'string' || url.startsWith('data:') || url.startsWith('blob:')) return url;
    
    // Catch previously botched proxies or relative proxy paths
    if (url.indexOf('/api/proxy/v2') !== -1) {
       if (url.indexOf(REAL_ORIGIN) === -1) {
          try {
             var u = new URL(url, REAL_ORIGIN);
             var search = u.searchParams.get('url');
             if (search) return PROXY_ENDPOINT + '?url=' + encodeURIComponent(search);
             return REAL_ORIGIN + u.pathname + u.search;
          } catch(e) {}
       }
       return url;
    }
    
    if (url.indexOf('_vercel/insights') !== -1) return url;
    
    try {
      var res = new URL(url, BASE_URL).href;
      var resObj = new URL(res);
      if (resObj.origin !== REAL_ORIGIN) {
        if (res.indexOf('challenges.cloudflare.com') !== -1) return res;
        return PROXY_ENDPOINT + '?url=' + encodeURIComponent(res);
      }
      // If it's a local path but NOT one of our system paths, it's a target asset being mis-resolved.
      if (resObj.origin === REAL_ORIGIN && !resObj.pathname.match(/^\\/(api|_next|workspace|favicon|logo)/)) {
          return PROXY_ENDPOINT + '?url=' + encodeURIComponent(new URL(url, TARGET_ORIGIN).href);
      }
    } catch(e) {}
    return url;
  };

  // 1. PATCH HISTORY (Origin Safe)
  var patchHistory = function(fn) {
    var original = History.prototype[fn];
    if (!original) return;
    History.prototype[fn] = function(state, title, url) {
      if (!url) return original.apply(this, arguments);
      try {
        var proxied = toProxy(url);
        // FORCE the proxy URL to be absolute to REAL_ORIGIN to satisfy browser Security checks
        if (proxied && proxied.indexOf('http') !== 0) {
           proxied = REAL_ORIGIN + (proxied.startsWith('/') ? '' : '/') + proxied;
        }
        
        // Only call original if we are successfully on the real origin
        if (proxied && (proxied.indexOf(REAL_ORIGIN) === 0)) {
           return original.call(this, state, title, proxied);
        }
      } catch(e) { console.warn('[Proxy] History failed', e); }
      return original.apply(this, arguments);
    };
  };
  patchHistory('pushState');
  patchHistory('replaceState');

  // 2. MASK PROPERTY GETTERS (Stealth + Fixes)
  var patchProp = function(proto, prop) {
    var d = Object.getOwnPropertyDescriptor(proto, prop);
    if (!d) return;
    Object.defineProperty(proto, prop, {
      set: function(v) { this._real_url = v; d.set.call(this, toProxy(v)); },
      get: function() {
        if (this._real_url) return new URL(this._real_url, BASE_URL).href;
        var cur = d.get.call(this);
        if (cur && cur.indexOf(PROXY_ENDPOINT) !== -1) {
          try {
            var up = new URL(cur).searchParams.get('url');
            if (up) return decodeURIComponent(up);
          } catch(e) {}
        }
        return cur;
      }
    });
  };
  ['src', 'href'].forEach(function(k) {
    patchProp(HTMLScriptElement.prototype, k);
    patchProp(HTMLLinkElement.prototype, k);
    patchProp(HTMLImageElement.prototype, k);
    patchProp(HTMLMediaElement.prototype, k);
  });

  // 3. NAVIGATION Interceptor
  document.addEventListener('click', function(e) {
    var a = e.target.closest('a');
    if (a && a.href && a.href.indexOf('javascript:') !== 0 && !a.hash) {
      try {
        var abs = new URL(a.getAttribute('href') || a.href, BASE_URL).href;
        if (abs.indexOf(TARGET_ORIGIN) === 0) {
           e.preventDefault();
           window.parent.postMessage({ type: 'CANFEED_NAVIGATE', url: abs }, '*');
        }
      } catch(err) {}
    }
  }, true);

  // 4. API & FONT PATCHING
  var originalFetch = window.fetch;
  window.fetch = function(i, init) {
    var u = (i instanceof Request) ? i.url : i;
    return originalFetch.call(this, toProxy(u), init);
  };
  var originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(m, u, a, b, c) {
    return originalOpen.call(this, m, toProxy(u), a, b, c);
  };
  if (navigator.sendBeacon) {
    var originalBeacon = navigator.sendBeacon;
    navigator.sendBeacon = function(u, d) { return originalBeacon.call(this, toProxy(u), d); };
  }
  if (window.FontFace) {
    var OriginalFontFace = window.FontFace;
    window.FontFace = function(f, s, d) {
      if (typeof s === 'string') s = toProxy(s);
      return new OriginalFontFace(f, s, d);
    };
  }

  // 5. DISABLE SERVICE WORKERS
  if ('serviceWorker' in navigator) {
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        register: function() { return Promise.resolve({ active: true }); },
        ready: new Promise(function() {}), controller: null, getRegistration: function() { return Promise.resolve(null); }, getRegistrations: function() { return Promise.resolve([]); }
      }, configurable: true
    });
  }

  console.log('[Proxy] Interceptor v8 Active (Origin Isolated)');
})();
`;

      let finalHtml = $.html();
      finalHtml = finalHtml.replace('<head>', '<head><script>' + interceptorCode + '</script>');

      return new Response(finalHtml, { status: 200, headers: responseHeaders });
    }

    // CSS REWRITING
    if (contentType.includes("text/css")) {
      let css = Buffer.from(response.data).toString("utf-8");
      css = css.replace(/url\s*\(\s*(['"]?)(.*?)\1\s*\)/gi, (match, quote, url) => {
        if (url.startsWith("data:")) return match;
        try {
          const abs = new URL(url, targetUrl).href;
          return `url(${quote}${myOrigin}/api/proxy/v2?url=${encodeURIComponent(abs)}${quote})`;
        } catch { return match; }
      });
      return new Response(css, { status, headers: responseHeaders });
    }

    return new Response(response.data, { status, headers: responseHeaders });

  } catch (error) {
    console.error("Proxy error:", targetUrl, error);
    return NextResponse.json({ error: "Proxy Failed" }, { status: 500 });
  }
}

export async function GET(r: NextRequest) { return handleRequest(r); }
export async function POST(r: NextRequest) { return handleRequest(r); }
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });
}
