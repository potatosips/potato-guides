export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/__debug") {
      const testPaths = [
        "/battery-health-check-Mi11x/index.html",
        "/Remote-wol-guide/index.html"
      ];

      const results = {};

      for (const path of testPaths) {
        const testUrl = new URL(request.url);
        testUrl.pathname = path;

        const res = await env.ASSETS.fetch(new Request(testUrl.toString(), request));

        results[path] = {
          status: res.status,
          statusText: res.statusText
        };
      }

      return new Response(
        JSON.stringify({
          host: url.hostname,
          pathname: url.pathname,
          assetTests: results
        }, null, 2),
        {
          headers: {
            "content-type": "application/json"
          }
        }
      );
    }

    const host = url.hostname.toLowerCase();

    const routes = {
      "batt-health-mi11x.potatosips.oporajita.win": "/battery-health-check-Mi11x",
      "remote-wol-guide.potatosips.oporajita.win": "/Remote-wol-guide"
    };

    const folder = routes[host];

    if (!folder) {
      return new Response("Site not found for host: " + host, { status: 404 });
    }

    const requestedPath = url.pathname === "/" ? "/index.html" : url.pathname;
    url.pathname = folder + requestedPath;

    return env.ASSETS.fetch(new Request(url.toString(), request));
  }
};
