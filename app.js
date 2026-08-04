// Campus map boundaries
var corner1 = L.latLng(17.192500, 104.085000);
var corner2 = L.latLng(17.197800, 104.091500);
var campusBounds = L.latLngBounds(corner1, corner2);
var buildingLayers = buildingLayers || [];

// Initialize the map and lock it to the campus area
const map = L.map('map', {
    center: [17.195288, 104.088414],
    zoom: 18,
    minZoom: 17,
    maxZoom: 20,
    maxBounds: campusBounds,
    maxBoundsViscosity: 1.0,
    zoomControl: false // Clears top-left for the sidebar
});

// Add zoom controls to the top-right corner
L.control.zoom({ position: 'topright' }).addTo(map);

// Base tile layers
const googleSatelliteTiles = L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
    attribution: 'Tiles &copy; Google Maps',
    maxZoom: 20,
    maxNativeZoom: 19
});

const standardTiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
});

googleSatelliteTiles.addTo(map);

// Layer groups and reference pins
const buildingLayer = L.layerGroup().addTo(map);
const navigationPins = L.layerGroup().addTo(map);

const campusPin = L.marker([17.195288, 104.088414]);
campusPin.bindPopup("<b>Sakon Nakhon Technical College</b><br>Campus Navigation Center.");
campusPin.addTo(navigationPins);

// Load campus GeoJSON building polygons
L.geoJSON(campusGeoJSON, {
    style: function(feature) {
        return {
            color: '#0056b3',
            fillColor: '#3399ff',
            fillOpacity: 0.5,
            weight: 2
        };
    },
    onEachFeature: function (feature, layer) {
        // Hover effects
        layer.on('mouseover', function () { this.setStyle({ fillColor: '#ffcc00', fillOpacity: 0.8 }); });
        layer.on('mouseout', function () { this.setStyle({ fillColor: '#3399ff', fillOpacity: 0.5 }); });

        if (feature.properties && feature.properties.Name) {
            // Clean hover tooltip instead of blocking map popup
            layer.bindTooltip(feature.properties.Name, { sticky: true });
            
            // Map Click Action -> Center map & Open Sidebar Detail View!
            layer.on('click', function (e) {
                map.setView(e.latlng, 20);
                showBuildingDetails(feature.properties);
            });
            
            // Store reference for search engine (includes properties!)
            buildingLayers.push({ 
                name: feature.properties.Name, 
                layer: layer, 
                properties: feature.properties 
            });
        }
    }
}).addTo(buildingLayer);

// Layer control UI
const baseMaps = {
    "Satellite View": googleSatelliteTiles,
    "Standard View": standardTiles
};

const overlayMaps = {
    "Campus Buildings": buildingLayer,
    "Navigation Pins": navigationPins
};

L.control.layers(baseMaps, overlayMaps, { collapsed: false }).addTo(map);

// Search box behavior
document.getElementById('search-input').addEventListener('input', function(e) {
    const searchText = e.target.value.toLowerCase();
    const resultsContainer = document.getElementById('search-results');
    resultsContainer.innerHTML = ''; 

    if (searchText.length === 0) return;

    const matches = buildingLayers.filter(item => item.name.toLowerCase().includes(searchText));

    matches.forEach(item => {
        const div = document.createElement('div');
        div.innerText = item.name;
        div.style.padding = '8px';
        div.style.cursor = 'pointer';
        div.style.borderBottom = '1px solid #eee';
        
        div.onmouseover = () => div.style.backgroundColor = '#f5f5f5';
        div.onmouseout = () => div.style.backgroundColor = 'transparent';

        // Search Click Action -> Center map & Open Sidebar Detail View!
        div.onclick = function() {
            const bounds = item.layer.getBounds();
            const center = bounds.getCenter();
            
            map.setView(center, 20);
            showBuildingDetails(item.properties);
        };

        resultsContainer.appendChild(div);
    });
});

function showBuildingDetails(properties) {
    const searchView = document.getElementById('search-view');
    const detailView = document.getElementById('detail-view');
    const titleEl = document.getElementById('building-title');
    const imgContainer = document.getElementById('building-image-container');
    const roomsList = document.getElementById('rooms-list');

    // 1. Set Building Title
    if (titleEl) {
        titleEl.innerText = properties.Name || "Unnamed Building";
    }

    // 2. Helper to update sidebar image
    function updateSidebarImage(imageUrl) {
        if (!imgContainer) return;
        if (imageUrl) {
            imgContainer.style.backgroundImage = `url('${imageUrl}')`;
            imgContainer.style.backgroundSize = 'cover';
            imgContainer.style.backgroundPosition = 'center';
            imgContainer.style.backgroundRepeat = 'no-repeat';
            imgContainer.innerHTML = ''; 
        } else {
            imgContainer.style.backgroundImage = 'none';
            imgContainer.innerHTML = '<span>📷 [ Image Placeholder ]</span>';
        }
    }

    updateSidebarImage(properties.image);

    // 3. Populate Rooms List
    if (roomsList) {
        roomsList.innerHTML = '';
        const rooms = properties.rooms || []; 
        
        if (rooms.length > 0) {
            rooms.forEach(room => {
                const roomName = typeof room === 'string' ? room : room.name;
                const roomImage = typeof room === 'object' ? room.image : null;

                const roomBtn = document.createElement('button');
                roomBtn.className = 'room-btn';
                roomBtn.innerText = roomName;
                roomBtn.style.cssText = `
                    text-align: left;
                    padding: 8px 12px;
                    background: #f8f9fa;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    width: 100%;
                    margin-bottom: 4px;
                `;
                
                roomBtn.onclick = function() {
                    if (roomImage) updateSidebarImage(roomImage);

                    document.querySelectorAll('.room-btn').forEach(btn => {
                        btn.style.backgroundColor = '#f8f9fa';
                        btn.style.borderColor = '#ddd';
                        btn.style.fontWeight = 'normal';
                    });

                    roomBtn.style.backgroundColor = '#e7f1ff';
                    roomBtn.style.borderColor = '#0056b3';
                    roomBtn.style.fontWeight = 'bold';
                };

                roomsList.appendChild(roomBtn);
            });
        } else {
            // Room Fallback Message
            roomsList.innerHTML = '<p style="color: #6c757d; font-size: 14px; padding: 8px;">No room details available for this building.</p>';
        }
    }

    // Add or reuse the navigation button inside the detail panel
    let dirBtn = document.getElementById('direction-btn');
    if (!dirBtn && detailView) {
        dirBtn = document.createElement('button');
        dirBtn.id = 'direction-btn';
        dirBtn.style.cssText = `
            width: 100%;
            margin-top: 15px;
            padding: 10px;
            background: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
        `;
        detailView.appendChild(dirBtn);
    }

    if (dirBtn) {
        dirBtn.innerText = `🚩 Navigate to ${properties.Name || "Building"}`;

        // Draw a route from the current user position to the selected building center
        dirBtn.onclick = function() {
            const match = buildingLayers.find(b => b.name === properties.Name);
            if (!match) return;

            const startLatLng = typeof userMarker !== 'undefined' && userMarker
                ? userMarker.getLatLng()
                : (currentStartCoords || L.latLng(17.195288, 104.088414));
            const destLatLng = match.layer.getBounds().getCenter();

            if (typeof drawRouteLine === 'function') {
                drawRouteLine(startLatLng, destLatLng);
            } else {
                alert('Navigation route drawing is not available yet.');
            }
        };
    }

    // 5. SWITCH SIDEBAR VIEWS (Crucial for sidebar visibility)
    if (searchView && detailView) {
        searchView.style.display = 'none';
        detailView.style.display = 'block';
    }
}


// 10. Back Button Event Handler
document.getElementById('back-btn').addEventListener('click', function() {
    document.getElementById('detail-view').style.display = 'none';
    document.getElementById('search-view').style.display = 'block';
});