// Génère le HTML d'une carte OpenStreetMap (Leaflet) sans clé API.
// Utilisé par MapView (natif via WebView) et MapView.web (iframe).

export type MapPoint = { lat: number; lng: number; label?: string };

const escape = (value: string) =>
  value.replace(/[<>&"]/g, (c) => (
    { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' } as Record<string, string>
  )[c] ?? c);

export function mapHtml(points: MapPoint[], zoom = 15): string {
  const markers = points.map((p) => ({
    lat: p.lat,
    lng: p.lng,
    label: p.label ? escape(p.label) : '',
  }));

  const data = JSON.stringify(markers);
  const first = markers[0] ?? { lat: 6.4489, lng: 2.3556 };

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
  html, body { margin: 0; padding: 0; height: 100%; background: #E8E5E2; }
  #map { position: absolute; top: 0; right: 0; bottom: 0; left: 0; }
  .leaflet-control-attribution { font-size: 9px; }
  .leaflet-popup-content { font: 600 12px/1.3 sans-serif; margin: 6px 10px; }
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  (function () {
    try {
      var pts = ${data};
      var map = L.map('map', { zoomControl: false, scrollWheelZoom: false });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      var markers = [];
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        var m = L.marker([p.lat, p.lng]).addTo(map);
        if (p.label) { m.bindPopup(p.label); }
        markers.push(m);
      }

      if (markers.length === 1) {
        map.setView([${first.lat}, ${first.lng}], ${zoom});
        if (pts[0].label) { markers[0].openPopup(); }
      } else if (markers.length > 1) {
        map.fitBounds(L.featureGroup(markers).getBounds(), { padding: [30, 30] });
      } else {
        map.setView([${first.lat}, ${first.lng}], ${zoom});
      }

      setTimeout(function () { map.invalidateSize(); }, 350);
    } catch (e) {}
  })();
</script>
</body>
</html>`;
}
