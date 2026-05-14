export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const host = url.hostname.toLowerCase();

    const routes = {
      "batt-health-mi11x.potatosips.oporajita.win": "/battery-health-check-Mi11x",
      "remote-wol-guide.potatosips.oporajita.win": "/remote-wol-guide"
    };

    const folder = routes[host];

    if (!folder) {
      return new Response("Site not found", { status: 404 });
    }

    const requestedPath = url.pathname === "/" ? "/index.html" : url.pathname;
    url.pathname = folder + requestedPath;

    return env.ASSETS.fetch(new Request(url.toString(), request));
  }
};
