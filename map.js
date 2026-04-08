// Leaflet Map Initialization and Operations

let mapInstance = null;
let markerInstance = null;

/**
 * Initialize or update the Leaflet map
 */
function updateMap(lat, lon, cityName) {
    const mapElement = document.getElementById('weather-map');
    const coordsBadge = document.getElementById('map-coords');
    
    // Update badge
    coordsBadge.textContent = `Lat: ${lat.toFixed(2)} Lon: ${lon.toFixed(2)}`;

    if (!mapInstance) {
        // Initialize map
        mapInstance = L.map('weather-map').setView([lat, lon], 10);

        // Add standard OpenStreetMap tiles
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
            maxZoom: 19
        }).addTo(mapInstance);
        
        // Add marker
        markerInstance = L.marker([lat, lon]).addTo(mapInstance);
        if (cityName) {
            markerInstance.bindPopup(`<b>${cityName}</b>`).openPopup();
        }
    } else {
        // Update existing map
        mapInstance.setView([lat, lon], 10);
        markerInstance.setLatLng([lat, lon]);
        
        if (cityName) {
            markerInstance.bindPopup(`<b>${cityName}</b>`).openPopup();
        }
    }
    
    // Force map to recalculate size (useful if map container was hidden or resized)
    setTimeout(() => {
        mapInstance.invalidateSize();
    }, 100);
}
