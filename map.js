import mapboxgl from 'https://cdn.jsdelivr.net/npm/mapbox-gl@2.15.0/+esm';

// Set your Mapbox public access token
mapboxgl.accessToken = 'pk.eyJ1Ijoia29iZXJoYXVzZXIiLCJhIjoiY213ZjA1OWM4MDI2cTMwbzdocXQ3ZGczdCJ9._djP7jt3KufuztH536Op9A';

// Initialize the map
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [-71.09415, 42.36027],
    zoom: 12,
    minZoom: 5,
    maxZoom: 18,
});

// Shared styling for Boston and Cambridge bike lanes
const bikeLaneStyle = {
    'line-color': '#32D400',
    'line-width': 3,
    'line-opacity': 0.6,
};

map.on('load', async () => {
    // Add Boston bike lane data
    map.addSource('boston_route', {
        type: 'geojson',
        data: 'https://bostonopendata-boston.opendata.arcgis.com/datasets/boston::existing-bike-network-2022.geojson',
    });

    // Display Boston bike lanes
    map.addLayer({
        id: 'boston-bike-lanes',
        type: 'line',
        source: 'boston_route',
        paint: bikeLaneStyle,
    });

    // Add Cambridge bike lane data
    map.addSource('cambridge_route', {
        type: 'geojson',
        data: 'https://data.cambridgema.gov/resource/9aey-9g9p.geojson?$limit=5000',
    });

    // Display Cambridge bike lanes
    map.addLayer({
        id: 'cambridge-bike-lanes',
        type: 'line',
        source: 'cambridge_route',
        paint: bikeLaneStyle,
    });
});
