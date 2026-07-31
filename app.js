// 1. Ultra-tight boundary box hugging just the campus rectangle property
const corner1 = L.latLng(17.192500, 104.085000); // South-West limit
const corner2 = L.latLng(17.197800, 104.091500); // North-East limit
const campusBounds = L.latLngBounds(corner1, corner2);
const buildingLayers = [];

// 2. Initialize the map with zoomControl turned OFF
const map = L.map('map', {
    center: [17.195288, 104.088414],
    zoom: 18,
    minZoom: 17,
    maxZoom: 20,
    maxBounds: campusBounds,
    maxBoundsViscosity: 1.0,
    zoomControl: false // Clears top-left for the sidebar
});

// 3. Add zoom controls to top-right
L.control.zoom({ position: 'topright' }).addTo(map);

// 4. Base Tile Layers
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

// 5. Layer Groups & Reference Pins
const buildingLayer = L.layerGroup().addTo(map);
const navigationPins = L.layerGroup().addTo(map);

const campusPin = L.marker([17.195288, 104.088414]);
campusPin.bindPopup("<b>Sakon Nakhon Technical College</b><br>Campus Navigation Center.");
campusPin.addTo(navigationPins);

// 6. Load GeoJSON Buildings
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

// 7. Layer Control UI
const baseMaps = {
    "Satellite View": googleSatelliteTiles,
    "Standard View": standardTiles
};

const overlayMaps = {
    "Campus Buildings": buildingLayer,
    "Navigation Pins": navigationPins
};

L.control.layers(baseMaps, overlayMaps, { collapsed: false }).addTo(map);

// 8. Search Engine Functionality
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

// 9. Sidebar Building Detail View Helper
function showBuildingDetails(properties) {
    const searchView = document.getElementById('search-view');
    const detailView = document.getElementById('detail-view');
    const titleEl = document.getElementById('building-title');
    const imgContainer = document.getElementById('building-image-container');
    const roomsList = document.getElementById('rooms-list');

    // Set Title
    titleEl.innerText = properties.Name || "Unnamed Building";

    // Helper function to update the sidebar image display
    function updateSidebarImage(imageUrl) {
        if (imageUrl) {
            imgContainer.style.backgroundImage = `url('${imageUrl}')`;
            imgContainer.style.backgroundSize = 'cover';
            imgContainer.style.backgroundPosition = 'center';
            imgContainer.innerHTML = ''; 
        } else {
            imgContainer.style.backgroundImage = 'none';
            imgContainer.innerHTML = '<span>📷 [ Image Placeholder ]</span>';
        }
    }

    // Set initial default building image when opened
    updateSidebarImage(properties.image);

    // Populate Rooms List
    roomsList.innerHTML = '';
    const rooms = properties.rooms || []; 
    
    rooms.forEach(room => {
        // Handle both string rooms and object rooms gracefully
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
            transition: all 0.2s ease;
        `;
        
        roomBtn.onmouseover = () => {
            if (!roomBtn.classList.contains('active')) {
                roomBtn.style.backgroundColor = '#e9ecef';
            }
        };
        roomBtn.onmouseout = () => {
            if (!roomBtn.classList.contains('active')) {
                roomBtn.style.backgroundColor = '#f8f9fa';
            }
        };
        
        // CLICK EVENT: Update the sidebar image to this room's photo
        roomBtn.onclick = function() {
            // 1. Swap the sidebar image
            if (roomImage) {
                updateSidebarImage(roomImage);
            }

            // 2. Add visual active state to the selected room button
            document.querySelectorAll('.room-btn').forEach(btn => {
                btn.classList.remove('active');
                btn.style.backgroundColor = '#f8f9fa';
                btn.style.borderColor = '#ddd';
                btn.style.fontWeight = 'normal';
            });

            roomBtn.classList.add('active');
            roomBtn.style.backgroundColor = '#e7f1ff';
            roomBtn.style.borderColor = '#0056b3';
            roomBtn.style.fontWeight = 'bold';
        };

        roomsList.appendChild(roomBtn);
    });

    // Switch sidebar views
    searchView.style.display = 'none';
    detailView.style.display = 'block';
}

// 10. Back Button Event Handler
document.getElementById('back-btn').addEventListener('click', function() {
    document.getElementById('detail-view').style.display = 'none';
    document.getElementById('search-view').style.display = 'block';
});