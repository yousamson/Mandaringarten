/**
 * Expo Router deliberately ignores experiments.baseUrl in development.
 * Keep Metro/Expo Go at their dedicated origin and make the shared /mobile/
 * entry redirect there, rather than interpreting "mobile" as a screen name.
 * This middleware is development-only; native manifests/bundles pass through.
 */
function createPreviewRouting(middleware, expoDomain, basePath = '/mobile/') {
  const prefix = `/${basePath.replace(/^\/+|\/+$/g, '')}`;
  const origin = expoDomain ? new URL(`https://${expoDomain}`).origin : null;

  return (req, res, next) => {
    const url = new URL(req.url, 'http://metro.local');
    if (url.pathname !== prefix && !url.pathname.startsWith(`${prefix}/`)) {
      return middleware(req, res, next);
    }
    if (!origin) {
      res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('The dedicated Expo preview domain is not configured.');
      return;
    }

    const pathname = url.pathname.slice(prefix.length) || '/';
    // Concatenate rather than resolve: a path beginning "//" must not change host.
    res.writeHead(302, {
      Location: `${origin}${pathname}${url.search}`,
      'Cache-Control': 'no-store',
    });
    res.end();
  };
}

module.exports = { createPreviewRouting };
