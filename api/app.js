import app from '../worker/index.js';

// Keep the same Web Request/Response application on both hosting providers.
export default {
  fetch(request) {
    const url = new URL(request.url);
    const route = url.searchParams.get('route');
    if (route) {
      if (!['status', 'generate', 'orders', 'capture', 'checkout-status'].includes(route)) {
        return Response.json({ error: 'Not found' }, { status: 404 });
      }
      url.pathname = '/api/' + route;
      url.searchParams.delete('route');
      request = new Request(url, request);
    }
    return app.fetch(request, process.env);
  },
};
