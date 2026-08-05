// ==========================================
// CAMPUS NAVIGATION MODULE (navigation.js)
// ==========================================

// 1. Waypoints Network (Intersections & Entrances)
// Replace or tweak these lat/lng coordinates to match real paths on your campus
const waypoints = {
    "main_gate": { lat: 17.194850, lng: 104.088560, name: "Main Entrance Gate" },
    "center_junction": { lat: 17.195288, lng: 104.088414, name: "Central Courtyard Junction" },
    "tech_bldg": { lat: 17.195600, lng: 104.087800, name: "Engineering / Tech Building" },
    "cafeteria": { lat: 17.194500, lng: 104.088900, name: "Cafeteria Entrance" }
};

// 2. Network Connections (Which points connect to which)
const graph = {
    "main_gate": ["center_junction"],
    "center_junction": ["main_gate", "tech_bldg", "cafeteria"],
    "tech_bldg": ["center_junction"],
    "cafeteria": ["center_junction"]
};

// Global layer variable to store the drawn route line
let activeRouteLayer = null;

// 3. Shortest Path Algorithm (Breadth-First Search)
function findShortestPath(startNodeId, endNodeId) {
    let queue = [[startNodeId]];
    let visited = new Set();

    while (queue.length > 0) {
        let path = queue.shift();
        let node = path[path.length - 1];

        if (node === endNodeId) {
            return path;
        }

        if (!visited.has(node)) {
            visited.add(node);
            let neighbors = graph[node] || [];
            for (let neighbor of neighbors) {
                let newPath = [...path, neighbor];
                queue.push(newPath);
            }
        }
    }
    return null;
}

// 4. Function to Draw Route on Leaflet Map
function drawRoute(startNodeId, endNodeId) {
    const pathNodeIds = findShortestPath(startNodeId, endNodeId);

    if (!pathNodeIds) {
        alert("No path found between these locations.");
        return;
    }

    // Convert node IDs into Leaflet lat/lng coordinates
    const routeCoordinates = pathNodeIds.map(id => [waypoints[id].lat, waypoints[id].lng]);

    // Clear previous line if one is already on the map
    if (activeRouteLayer) {
        map.removeLayer(activeRouteLayer);
    }

    // Draw red dashed path line on map
    activeRouteLayer = L.polyline(routeCoordinates, {
        color: '#ff3300',
        weight: 5,
        opacity: 0.8,
        dashArray: '8, 8'
    }).addTo(map);

    // Zoom map view to fit the route
    map.fitBounds(activeRouteLayer.getBounds(), { padding: [40, 40] });
}

function findNearestWaypoint(latlng) {
    const maxSnapDistanceMeters = 30;
    let nearestNode = null;
    let nearestDistance = Number.POSITIVE_INFINITY;

    Object.entries(waypoints).forEach(([nodeId, point]) => {
        const candidateLatLng = L.latLng(point.lat, point.lng);
        const distance = latlng.distanceTo(candidateLatLng);

        if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestNode = nodeId;
        }
    });

    return nearestDistance <= maxSnapDistanceMeters ? nearestNode : null;
}

function drawRouteLine(startLatLng, destLatLng) {
    if (activeRouteLayer) {
        map.removeLayer(activeRouteLayer);
    }

    const startNode = findNearestWaypoint(startLatLng);
    const destNode = findNearestWaypoint(destLatLng);
    const routeCoordinates = [startLatLng];

    if (startNode && destNode) {
        const pathNodeIds = findShortestPath(startNode, destNode);

        if (pathNodeIds && pathNodeIds.length > 1) {
            pathNodeIds.forEach((id) => {
                routeCoordinates.push(L.latLng(waypoints[id].lat, waypoints[id].lng));
            });
        }
    }

    routeCoordinates.push(destLatLng);

    activeRouteLayer = L.polyline(routeCoordinates, {
        color: '#ff3300',
        weight: 5,
        opacity: 0.8,
        dashArray: '8, 8'
    }).addTo(map);

    map.fitBounds(activeRouteLayer.getBounds(), { padding: [40, 40] });
}

// 5. Setup Live GPS Tracking
let userMarker = null;
let currentStartCoords = null;

function enableGPS() {
    map.locate({ setView: false, watch: true, enableHighAccuracy: true });
}

map.on('locationfound', function(e) {
    currentStartCoords = e.latlng;

    if (userMarker) {
        map.removeLayer(userMarker);
    }

    // Blue dot for live user position
    userMarker = L.circleMarker(e.latlng, {
        radius: 8,
        fillColor: '#007bff',
        color: '#ffffff',
        weight: 2,
        opacity: 1,
        fillOpacity: 1
    }).addTo(map).bindTooltip("You are here");
});

// Start tracking GPS automatically when navigation module loads
enableGPS();