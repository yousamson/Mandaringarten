const API_ORIGIN = 'https://mandarin-garden.replit.app';

export default {
  async fetch(request) {
    const incomingUrl = new URL(request.url);

    if (!incomingUrl.pathname.startsWith('/api/')) {
      return new Response('Not found', { status: 404 });
    }

    const upstreamUrl = new URL(
      `${incomingUrl.pathname}${incomingUrl.search}`,
      API_ORIGIN,
    );
    const upstreamRequest = new Request(upstreamUrl, request);
    const headers = new Headers(upstreamRequest.headers);
    headers.set('x-forwarded-host', incomingUrl.host);
    headers.set('x-forwarded-proto', incomingUrl.protocol.slice(0, -1));
    headers.delete('host');

    const forwardedRequest = new Request(upstreamRequest, {
      headers,
      redirect: 'manual',
    });

    return fetch(forwardedRequest);
  },
};
