(async () => {
  const p = new URLSearchParams(location.search),
        metric = p.get("metric"),
        owner  = p.get("ownerId"),
        loc    = p.get("locationId");

  let path = `/v2/opportunities?locationId=${loc}`;
  if (metric === "won_revenue") path += `&ownerId=${owner}&status=won`;

  const res  = await fetch(`https://YOUR_PROXY_URL${path}`),
        data = await res.json();

  const val = metric === "won_revenue"
    ? data.reduce((sum, o) => sum + o.value, 0)
    : data.length;

  document.querySelector(".value").textContent =
    new Intl.NumberFormat().format(val);
})();
