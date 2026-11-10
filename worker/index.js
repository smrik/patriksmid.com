export default {
  fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname === 'www.patriksmid.com') {
      return Response.redirect(`https://patriksmid.com${url.pathname}${url.search}`, 301);
    }
    const path = url.pathname;
    if (
      path === '/flatbot' || path.startsWith('/flatbot/') ||
      path === '/hub' || path.startsWith('/hub/')
    ) {
      // A Worker route keeps fetch(request) pointed at the existing DNS origin.
      return fetch(request);
    }
    return env.ASSETS.fetch(request);
  },
};
