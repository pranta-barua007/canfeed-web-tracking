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
        const response = await axios.get(targetUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            },
            responseType: "arraybuffer", // Handle binary data (images/fonts) correctly
            validateStatus: () => true,
        });

        const contentType = response.headers["content-type"] || "";

        // 1. If it's HTML, we inject our fixes
        if (contentType.includes("text/html")) {
            const html = Buffer.from(response.data).toString("utf-8");
            const $ = cheerio.load(html);

            // Remove blocking headers/meta
            $('meta[http-equiv="Content-Security-Policy"]').remove();
            $('meta[http-equiv="X-Frame-Options"]').remove();

            const targetUrlObj = new URL(targetUrl);
            const targetOrigin = targetUrlObj.origin;
            // Helper to make absolute URLs
            const toAbsolute = (p: string) => new URL(p, targetUrl).href;

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
            $('head').prepend(`<base href="${targetUrl}">`);

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
