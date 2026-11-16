// Génère le HTML d'une carte OpenStreetMap (Leaflet) sans clé API.
// Utilisé par MapView (natif via WebView) et MapView.web (iframe).

const escape = (value: string) =>
  value.replace(/[<>&"]/g, (c) => (
    { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' } as Record<string, string>
  )[c] ?? c);

export function mapHtml(lat: number, lng: number, label = '', zoom = 15): string {
  const safe = escape(label);
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
      var map = L.map('map', { zoomControl: false, scrollWheelZoom: false }).setView([${lat}, ${lng}], ${zoom});
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);
      var marker = L.marker([${lat}, ${lng}]).addTo(map);
      ${safe ? `marker.bindPopup(${JSON.stringify(safe)}).openPopup();` : ''}
      setTimeout(function () { map.invalidateSize(); }, 350);
    } catch (e) {}
  })();
</script>
</body>
</html>`;
}
