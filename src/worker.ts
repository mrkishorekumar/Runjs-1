interface Fetcher {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

interface Env {
  ASSETS: Fetcher;
}

const SECURITY_HEADERS: Record<string, string> = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'sha256-0mMKUFO/NuIvybcvvGw7PUDoXnlsXaPplv0yJod+Axk=' 'sha256-r/gJ76xjzRMyLkTE4dfCuXLlYsaS8kakrGmtWKPrx5o=' 'sha256-1dPro/fD2S5/wkAu3BGLYvHgEhscriMlL+8xD/rEGlE=' 'unsafe-eval' 'wasm-unsafe-eval' https://cdn.jsdelivr.net https://static.cloudflareinsights.com",
    "script-src-elem 'self' 'sha256-0mMKUFO/NuIvybcvvGw7PUDoXnlsXaPplv0yJod+Axk=' 'sha256-r/gJ76xjzRMyLkTE4dfCuXLlYsaS8kakrGmtWKPrx5o=' 'sha256-1dPro/fD2S5/wkAu3BGLYvHgEhscriMlL+8xD/rEGlE=' 'unsafe-eval' 'wasm-unsafe-eval' https://cdn.jsdelivr.net https://static.cloudflareinsights.com",
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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const response = await env.ASSETS.fetch(request);

    const newHeaders = new Headers(response.headers);
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
      newHeaders.set(key, value);
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  },
};
