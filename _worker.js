export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const host = url.hostname.toLowerCase();

    const routes = {
      "batt-health-mi11x.potatosips.oporajita.win": "/battery-health-check-Mi11x",
      "remote-wol-guide.potatosips.oporajita.win": "/Remote-wol-guide"
    };

    const targetPath = routes[host];

    if (targetPath) {
      const newUrl = new URL(request.url);
      newUrl.pathname = targetPath;
      return env.ASSETS.fetch(newUrl);
    }

    return new Response("Site not found", {
      status: 404,
      headers: {
        "content-type": "text/plain",
      },
    });
  },
};
