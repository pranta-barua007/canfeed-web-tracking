import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  try {
    const targetUrlObj = new URL(targetUrl);
    const targetOrigin = targetUrlObj.origin;

    const response = await axios.get(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": targetOrigin, // Vital for hotlink protection and some access checks
        "Accept": req.headers.get("accept") || "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      },
      responseType: "arraybuffer", // Handle binary data (images/fonts) correctly
      validateStatus: () => true,
    });

    const contentType = response.headers["content-type"] || "";

    // SPECIAL HANDLING: SCRIPTS RETURNING HTML (404/500/Auth Errors)
    // If the browser expects a script but gets an HTML error page, it throws "MIME type" or "Syntax" errors.
    // We intercept this and return a valid JS file that logs the error instead.
    const isScript = targetUrl.match(/\.(js|mjs)($|\?)/);
    if (isScript && (contentType.includes("text/html") || response.status >= 400)) {
      console.warn(`[Proxy] Script failed: ${targetUrl} (${response.status} ${contentType}) - Returning fallback JS.`);
      return new NextResponse(
        `console.error("[CanFeed Proxy] Failed to load script: ${targetUrl} (Status: ${response.status})");`,
        {
          status: 200, // Return 200 so the browser executes our error logging script
          headers: {
            "Content-Type": "application/javascript",
            "Access-Control-Allow-Origin": "*"
          }
        }
      );
    }

    // 1. If it's HTML, we inject our fixes
    if (contentType.includes("text/html")) {
      const html = Buffer.from(response.data).toString("utf-8");
      const $ = cheerio.load(html);

      // Remove blocking headers/meta
      $('meta[http-equiv="Content-Security-Policy"]').remove();
      $('meta[http-equiv="X-Frame-Options"]').remove();

      // 1a. RESOLVE BASE URL
      // Many apps (Angular/React) use <base href="/"> to ensure assets load from root,
      // even if the user is deep in a subpath like /about/.
      // We must respect this, otherwise relative scripts 'runtime.js' will 404 at '/about/runtime.js'.
      let baseUrl = targetUrl;
      const existingBase = $('base[href]').first().attr('href');
      if (existingBase) {
        // Resolve the existing base relative to the targetUrl
        // e.g. <base href="/"> on https://site.com/foo/ -> https://site.com/
        baseUrl = new URL(existingBase, targetUrl).href;
        $('base').remove(); // Remove original to avoid conflicts
      }

      // Helper to make absolute URLs (Using the correct Base)
      const toAbsolute = (p: string) => new URL(p, baseUrl).href;

      // Get our origin (e.g. http://localhost:3000)
      const myOrigin = req.nextUrl.origin;

      // Helper to proxy-fy URLs
      const toProxy = (p: string) => {
        const abs = toAbsolute(p);
        let url = `${myOrigin}/api/proxy?url=${encodeURIComponent(abs)}`;
        // Hack to beat Next.js invariant check: "Expected document.currentScript src to contain '/_next/'"
        // Next.js checks if the script src contains '/_next/' to identify its own chunks.
        if (abs.includes("/_next/")) {
          url += "&__next_bypass=/_next/";
        }
        return url;
      };

      // INJECT BASE TAG (Crucial for dynamic assets like new Image().src = '/foo')
      // We use the proxy for static stuff we can catch (to avoid CORS), but for the rest, 
      // we fallback to the target origin via Base tag.
      // NOTE: <base> makes root-relative links like '/api/proxy' resolve to target!
      // That's why we MUST use 'myOrigin' in toProxy above to force them back to us.
      $('head').prepend(`<base href="${baseUrl}">`);

      // REWRITE ATTRIBUTES INSTEAD OF <BASE>
      // This forces assets to load via our proxy (which adds CORS headers)
      $('link[href]').each((_, el) => {
        const val = $(el).attr('href');
        if (val && !val.startsWith('data:') && !val.startsWith(targetUrl)) {
          // If we don't proxy, the base tag handles it. 
          // BUT we WANT to proxy to enable CORS access if needed.
          $(el).attr('href', toProxy(val));
        }
      });
      $('script[src]').each((_, el) => {
        const val = $(el).attr('src');
        if (val && !val.startsWith('data:')) {
          $(el).attr('src', toProxy(val));
        }
      });
      // OPTIMIZATION: MEDIA OFFLOADING
      // We do NOT proxy images/videos/audio. We rewrite them to absolute URLs so the browser fetches them directly.
      // This saves massive bandwidth on our server.

      // 1. IMAGES
      $('img[src]').each((_, el) => {
        const val = $(el).attr('src');
        if (val && !val.startsWith('data:')) {
          $(el).attr('src', toAbsolute(val));
          $(el).attr('referrerpolicy', 'no-referrer');
        }
        const srcset = $(el).attr('srcset');
        if (srcset) {
          const newSrcset = srcset.split(',').map(part => {
            const [url, desc] = part.trim().split(/\s+/);
            if (url && !url.startsWith('data:')) {
              return `${toAbsolute(url)} ${desc || ''}`;
            }
            return part;
          }).join(', ');
          $(el).attr('srcset', newSrcset);
        }
      });

      // 2. VIDEO & AUDIO
      $('video[src], audio[src]').each((_, el) => {
        const val = $(el).attr('src');
        if (val && !val.startsWith('data:')) {
          $(el).attr('src', toAbsolute(val));
        }
      });
      // Handle child <source> tags for picture/video/audio
      $('source[src]').each((_, el) => {
        const val = $(el).attr('src');
        if (val && !val.startsWith('data:')) {
          $(el).attr('src', toAbsolute(val));
        }
      });
      $('source[srcset]').each((_, el) => {
        const val = $(el).attr('srcset');
        if (val) {
          const newSrcset = val.split(',').map(part => {
            const [url, desc] = part.trim().split(/\s+/);
            if (url && !url.startsWith('data:')) {
              return `${toAbsolute(url)} ${desc || ''}`;
            }
            return part;
          }).join(', ');
          $(el).attr('srcset', newSrcset);
        }
      });
      // Track <track> elements for subtitles
      $('track[src]').each((_, el) => {
        const val = $(el).attr('src');
        if (val && !val.startsWith('data:')) {
          $(el).attr('src', toAbsolute(val));
        }
      });

      // 3. OBJECTS & EMBEDS (Flash, PDF, etc)
      $('object[data]').each((_, el) => {
        const val = $(el).attr('data');
        if (val && !val.startsWith('data:')) {
          $(el).attr('data', toAbsolute(val));
        }
      });
      $('embed[src]').each((_, el) => {
        const val = $(el).attr('src');
        if (val && !val.startsWith('data:')) {
          $(el).attr('src', toAbsolute(val));
        }
      });

      // 4. IFRAMES (Nested iframes)
      // If the target page has iframes, we should probably let them load directly 
      // instead of recursively proxying them, unless we want to track inside them too?
      // For now, offloading them is safer for performance and avoids "inception" proxy loops.
      $('iframe[src]').each((_, el) => {
        const val = $(el).attr('src');
        if (val && !val.startsWith('data:')) {
          $(el).attr('src', toAbsolute(val));
        }
      });

      // INJECT INTERCEPTOR SCRIPT
      const interceptorScript = `
          <script>
            (function() {
              const PROXY_ENDPOINT = '/api/proxy';
              const TARGET_ORIGIN = '${targetOrigin}';
              
              // DISABLE SERVICE WORKERS (Avoids pollution and broken caches)
              if ('serviceWorker' in navigator) {
                  // Mock basic API to prevent crashes, but disable functionality
                  Object.defineProperty(navigator, 'serviceWorker', {
                      value: {
                          register: async () => { console.warn('[Proxy] ServiceWorker blocked'); return {}; },
                          ready: new Promise(() => {}),
                          controller: null,
                          getRegistration: async () => null,
                          getRegistrations: async () => []
                      }
                  });
              }

              // PATCH HISTORY API (Fixes SecurityError)
              // The app thinks it's on Target Domain, tries to pushState 'https://target.com/foo'
              // Browser says: "No, you are localhost".
              const noop = () => {};
              window.history.pushState = noop;
              window.history.replaceState = noop;

              // PATCH FETCH & XHR (For API calls)
              const originalFetch = window.fetch;
              window.fetch = async function(input, init) {
                let url = input;
                if (input instanceof Request) {
                    url = input.url;
                }
                
                // If it's a relative URL, browser resolves against localhost.
                // We need to rebinding it to target.
                // BUT, since we removed <base>, we might need to be smart.
                // Actually, since we rewrite scripts, the scripts are loaded from 'localhost/api/proxy...'
                // So their relative paths might be relative to the proxy URL?
                // This is complex.
                // Simpler: If the URL is NOT absolute, assume it's meant for target.
                
                let resolved = url;
                try {
                    // Try to resolve against target
                    // If url is '/api/users', invalid URL without base.
                    resolved = new URL(url, '${targetUrl}').href;
                } catch(e) {}

                // If it targets the original site, proxy it.
                if (resolved.startsWith(TARGET_ORIGIN)) {
                     const proxiedUrl = \`\${PROXY_ENDPOINT}?url=\${encodeURIComponent(resolved)}\`;
                     return originalFetch(proxiedUrl, init);
                }
                
                return originalFetch(input, init);
              };

              // PATCH XHR
              const originalOpen = XMLHttpRequest.prototype.open;
              XMLHttpRequest.prototype.open = function(method, url, ...args) {
                 let resolved = url;
                 try {
                     resolved = new URL(url, '${targetUrl}').href;
                 } catch(e) {}
                 
                 if (resolved.startsWith(TARGET_ORIGIN)) {
                     const proxiedUrl = \`\${PROXY_ENDPOINT}?url=\${encodeURIComponent(resolved)}\`;
                     return originalOpen.call(this, method, proxiedUrl, ...args);
                 }
                 return originalOpen.call(this, method, url, ...args);
              };

              // INTERCEPT FORMS (Fix for Remix/SSR Forms)
              document.addEventListener('submit', function(e) {
                  // We can't easily proxy standard full-page form POSTs yet because we need to
                  // handle the body and method in our proxy route (currently GET only).
                  // For now, we prefer to let them try (via base tag) or warn?
                  // Actually, modern frameworks often use 'submit' events to do fetch() anyway.
                  // Since we patched fetch(), those work!
                  // It's only "native" non-JS forms that are the issue.
                  // Let's leave them be for now, as blocking them breaks more than it fixes.
                  // The <base> tag will direct them to the target. It might X-Frame-Option fail, but that's better than silent death.
              }, true);

              // INTERCEPT CLICKS (For Navigation Sync)
              document.addEventListener('click', function(e) {
                  const link = e.target.closest('a');
                  if (link) {
                      const rawHref = link.getAttribute('href');
                      if (!rawHref) return;

                      // Filter out special schemes
                      if (rawHref.startsWith('javascript:') || rawHref.startsWith('mailto:') || rawHref.startsWith('#')) return;

                      // Manually resolve against TARGET_ORIGIN
                      // This avoids the browser resolving it against 'localhost' if <base> fails or acts weirdly with properties
                      let resolvedHref = rawHref;
                      try {
                          resolvedHref = new URL(rawHref, '${targetUrl}').href;
                      } catch(e) {
                          // If resolution fails, fallback to raw? or ignore?
                          console.error('[Proxy] Failed to resolve href:', rawHref);
                          return;
                      }

                      // We want to intercept essentially ALL internal links
                      e.preventDefault();
                      console.log('[Proxy] Intercepted navigation to:', resolvedHref);
                      window.parent.postMessage({ type: 'CANFEED_NAVIGATE', url: resolvedHref }, '*');
                  }
              }, true); // Capture phase
              
              console.log('CanFeed Proxy Interceptor v2 Active + Nav Sync');
            })();
          </script>
        `;

      $('head').prepend(interceptorScript);

      const modifiedHtml = $.html();
      const nextResponse = new NextResponse(modifiedHtml, {
        status: response.status,
        headers: { "Content-Type": "text/html" },
      });
      nextResponse.headers.delete("X-Frame-Options");
      nextResponse.headers.delete("Content-Security-Policy");
      return nextResponse;
    }


    // 2. If it's CSS, we need to rewrite url(...) for fonts/images
    if (contentType.includes("text/css")) {
      const css = Buffer.from(response.data).toString("utf-8");
      // Regex to find url(...)
      // We need to resolve relative paths in CSS to absolute, then proxy them.
      const toAbsolute = (p: string) => {
        // CSS might be relative to the CSS file itself, not the HTML page. 
        // But 'targetUrl' is the CSS file URL here.
        try {
          return new URL(p.replace(/['"]/g, ""), targetUrl).href;
        } catch { return p; }
      };
      const toProxy = (p: string) => `/api/proxy?url=${encodeURIComponent(toAbsolute(p))}`;

      const modifiedCss = css.replace(/url\(([^)]+)\)/g, (match, url) => {
        // url might be wrapped in quotes
        const cleanUrl = url.trim().replace(/^['"]|['"]$/g, "");
        if (cleanUrl.startsWith("data:")) return match;
        return `url("${toProxy(cleanUrl)}")`;
      });

      const nextResponse = new NextResponse(modifiedCss, {
        status: response.status,
        headers: {
          "Content-Type": "text/css",
          "Access-Control-Allow-Origin": "*",
        },
      });
      return nextResponse;
    }

    // 3. Non-HTML/CSS (API responses, images, scripts) -> Stream back
    const nextResponse = new NextResponse(response.data, {
      status: response.status,
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
      },
    });

    nextResponse.headers.delete("X-Frame-Options");
    nextResponse.headers.delete("Content-Security-Policy");
    return nextResponse;

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Proxy error for:", targetUrl, message);
    return NextResponse.json({ error: "Failed to fetch URL", details: message }, { status: 500 });
  }
}