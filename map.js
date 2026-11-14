import mapboxgl from 'https://cdn.jsdelivr.net/npm/mapbox-gl@2.15.0/+esm';

import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

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

const svg = d3.select('#map').select('svg');

function getCoords(station) {
    const point = new mapboxgl.LngLat(+station.lon, +station.lat);
    const { x, y } = map.project(point);
    return { cx: x, cy: y };
}

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

    // Load Bluebikes station data
    try {
        const jsonurl = 'https://dsc106.com/labs/lab07/data/bluebikes-stations.json';
        const jsonData = await d3.json(jsonurl);

        console.log('Loaded JSON Data:', jsonData);

        let stations = jsonData.data.stations;
        console.log('Stations Array:', stations);


        // Load March 2024 Bluebikes trip data
        const trips = await d3.csv(
            'https://dsc106.com/labs/lab07/data/bluebikes-traffic-2024-03.csv'
        );

        console.log('Trips Array:', trips);
        console.log('Number of trips:', trips.length);


        // Count departures from each station
        const departures = d3.rollup(
            trips,
            (v) => v.length,
            (d) => d.start_station_id,
        );

        // Count arrivals at each station
        const arrivals = d3.rollup(
            trips,
            (v) => v.length,
            (d) => d.end_station_id,
        );

        // Add traffic counts to each station
        stations = stations.map((station) => {
            let id = station.short_name;
            station.arrivals = arrivals.get(id) ?? 0;
            station.departures = departures.get(id) ?? 0;
            station.totalTraffic = station.arrivals + station.departures;
            return station;
        });

        console.log('Stations with traffic:', stations);

        // Scale circle area according to station traffic
        const radiusScale = d3
            .scaleSqrt()
            .domain([0, d3.max(stations, (d) => d.totalTraffic)])
            .range([0, 25]);


        
        const circles = svg
            .selectAll('circle')
            .data(stations)
            .enter()
            .append('circle')
            .attr('r', (d) => radiusScale(d.totalTraffic))
            .attr('fill', 'steelblue')
            .attr('stroke', 'white')
            .attr('stroke-width', 1)
            .attr('opacity', 0.8)
            .each(function (d) {
                d3.select(this)
                    .append('title')
                    .text(
                        `${d.totalTraffic} trips (${d.departures} departures, ${d.arrivals} arrivals)`
                    );
            });

        // Update circle positions to match the map
        function updatePositions() {
            circles
                .attr('cx', (d) => getCoords(d).cx)
                .attr('cy', (d) => getCoords(d).cy);
        }

        // Position circles initially
        updatePositions();

        // Reposition circles when the map moves
        map.on('move', updatePositions);
        map.on('zoom', updatePositions);
        map.on('resize', updatePositions);
        map.on('moveend', updatePositions);
    } catch (error) {
        console.error('Error loading JSON:', error);
    }
});
