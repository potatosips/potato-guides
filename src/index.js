export default {
  async fetch(request, env) {
    const originalUrl = new URL(request.url);
    const host = originalUrl.hostname.toLowerCase();

    const routes = {
      "batt-health-mi11x.potatosips.oporajita.win": "/battery-health-check-Mi11x",
      "remote-wol-guide.potatosips.oporajita.win": "/Remote-wol-guide",
      "dnssec-dot-over-stubby.potatosips.oporajita.win": "/DNSSEC-DOT-over-stubby",
      "arch-baremetal-install.potatosips.oporajita.win": "/arch-bare-metal-install",
      "cloudflare-ipv6-ddns.potatosips.oporajita.win": "/Cloudflare-ipv6-ddns-windows",
      "openwrt-mesh-setup.potatosips.oporajita.win": "/openwrt-mesh-setup"
    };

    const folder = routes[host];

    if (!folder) {
      return new Response("Site not found for host: " + host, {
        status: 404,
        headers: { "content-type": "text/plain" }
      });
    }

    const assetUrl = new URL(request.url);

    if (originalUrl.pathname === "/" || originalUrl.pathname === "") {
      assetUrl.pathname = folder + "/index.html";
    } else {
      assetUrl.pathname = folder + originalUrl.pathname;
    }

    return env.ASSETS.fetch(new Request(assetUrl.toString(), request));
  }
};
