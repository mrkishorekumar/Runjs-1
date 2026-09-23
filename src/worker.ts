interface Fetcher {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

interface Env {
  ASSETS: Fetcher;
}

const SECURITY_HEADERS: Record<string, string> = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' https://cdn.jsdelivr.net https://static.cloudflareinsights.com",
    "script-src-elem 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' https://cdn.jsdelivr.net https://static.cloudflareinsights.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net https://unpkg.com",
    "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net https://unpkg.com data:",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://unpkg.com https://cdn.jsdelivr.net https://cloudflareinsights.com https://registry.npmjs.org https://*.codesandbox.io https://*.csb.app https://sandpack-bundler.pages.dev blob: data:",
    "worker-src 'self' blob: data:",
    "frame-src 'self' https://*.codesandbox.io https://*.csb.app https://sandpack-bundler.pages.dev",
    "frame-ancestors 'self'",
    "object-src 'none'",
    "base-uri 'self'",
  ].join('; '),
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy':
    'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
};

// Permanent 301 redirects for topical search intent aliases to canonical URLs
const ROUTE_REDIRECTS: Record<string, string> = {
  '/javascript-playground': '/js',
  '/javascript-compiler': '/js',
  '/javascript-online-editor': '/js',
  '/javascript-console': '/js',
  '/js-playground': '/js',
  '/typescript-playground': '/ts',
  '/ts-playground': '/ts',
  '/react-playground': '/react',
  '/react-sandbox': '/react',
  '/html-playground': '/html',
  '/html-preview-studio': '/html',
  '/learn-javascript': '/learn',
  '/javascript-problems': '/problems',
  '/javascript-event-loop': '/visualizer',
  '/event-loop': '/visualizer',
  '/event-loop-visualizer': '/visualizer',
  '/context-visualizer': '/execution-context',
  '/privacy-policy': '/privacy',
  '/terms-and-conditions': '/terms',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // 1. Host canonicalization: redirect www.runjs.in -> runjs.in
    if (url.hostname === 'www.runjs.in') {
      url.hostname = 'runjs.in';
      url.protocol = 'https:';
      return Response.redirect(url.toString(), 301);
    }

    // 2. Trailing slash normalization: redirect /path/ -> /path (exclude root / and static files)
    if (
      url.pathname.length > 1 &&
      url.pathname.endsWith('/') &&
      !url.pathname.includes('.')
    ) {
      url.pathname = url.pathname.slice(0, -1);
      return Response.redirect(url.toString(), 301);
    }

    // 3. Topical search intent & alias 301 redirects to canonical URLs
    const targetRedirect = ROUTE_REDIRECTS[url.pathname];
    if (targetRedirect) {
      url.pathname = targetRedirect;
      return Response.redirect(url.toString(), 301);
    }

    // 4. Forward to Cloudflare ASSETS
    const response = await env.ASSETS.fetch(request);

    // 5. Apply security headers
    const newHeaders = new Headers(response.headers);
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
      newHeaders.set(key, value);
    }

    // 6. If accessing /404 or response is not found, ensure 404 status code and noindex robots tag
    let status = response.status;
    let statusText = response.statusText;
    if (status === 404 || url.pathname === '/404') {
      status = 404;
      statusText = 'Not Found';
      newHeaders.set('X-Robots-Tag', 'noindex, follow');
    }

    return new Response(response.body, {
      status,
      statusText,
      headers: newHeaders,
    });
  },
};
