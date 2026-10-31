const API_ORIGIN = 'https://mandarin-garden.replit.app';

export default {
  async fetch(request, env) {
    const incomingUrl = new URL(request.url);

    if (!incomingUrl.pathname.startsWith('/api/')) {
      return env.ASSETS.fetch(request);
    }

    const upstreamUrl = new URL(
      `${incomingUrl.pathname}${incomingUrl.search}`,
      API_ORIGIN,
    );
    const upstreamRequest = new Request(upstreamUrl, request);
    const headers = new Headers(upstreamRequest.headers);
    // Replit's edge replaces X-Forwarded-Host. Carry the original site
    // origin separately; the API accepts only the registered custom domain.
    headers.set('x-mandarin-public-origin', incomingUrl.origin);
    headers.set('x-forwarded-host', incomingUrl.host);
    headers.set('x-forwarded-proto', incomingUrl.protocol.slice(0, -1));
    headers.delete('host');

    const forwardedRequest = new Request(upstreamRequest, {
      headers,
      redirect: 'manual',
    });

    const response = await fetch(forwardedRequest);
    const location = response.headers.get('location');
    if (location) {
      const target = new URL(location, upstreamUrl);
      if (
        target.origin === upstreamUrl.origin &&
        target.pathname.startsWith('/api/')
      ) {
        target.protocol = incomingUrl.protocol;
        target.host = incomingUrl.host;
        const responseHeaders = new Headers(response.headers);
        responseHeaders.set('location', target.toString());
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
        });
      }
    }

    return response;
  },
};
