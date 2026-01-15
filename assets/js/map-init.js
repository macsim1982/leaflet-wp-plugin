const fitBoundsOptions = {
    padding: [30, 30],
};

const SVG_ICONS = {
    custom: (color) => `
        <svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 0C7.2 0 0 7.2 0 16c0 12 16 26 16 26s16-14 16-26C32 7.2 24.8 0 16 0z" fill="${color}"/>
            <circle cx="16" cy="16" r="6" fill="#fff"/>
        </svg>
    `,
    asterisk: (color) => `
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="30" fill="${color}"/>
            <path d="M45.5 36.3c.4.2.5.5.5.9c0 .5-.3 1.2-1 2.3c-.6 1.1-1.1 1.7-1.5 2c-.4.2-.7.2-1.1 0l-8.6-6.2L35 45.8c.1.4-.1.7-.5.9c-.4.2-1.3.3-2.5.3s-2.1-.1-2.5-.3c-.4-.2-.6-.5-.5-.9l1.1-10.5l-8.5 6.2c-.3.2-.7.2-1.1 0c-.4-.2-.9-.9-1.5-2c-.6-1-.9-1.8-.9-2.3c0-.5.2-.8.5-.9l9.7-4.3l-9.7-4.3c-.4-.2-.6-.5-.5-1c0-.5.3-1.2.9-2.3c.6-1 1.1-1.7 1.5-1.9s.8-.2 1.1 0l8.5 6.2L29 18.3c-.1-.4.1-.7.5-1s1.3-.3 2.5-.3s2.1.1 2.5.3c.4.2.6.5.5 1l-1.1 10.5l8.6-6.2c.3-.2.7-.2 1.1 0s.9.9 1.5 2c.6 1 .9 1.8 1 2.2c0 .5-.1.8-.5 1L35.8 32l9.7 4.3" fill="#fff"/>
        </svg>
    `
};

function panToPopup(marker, map) {
    const popup = marker.getPopup();
    const popupEl = popup.getElement();
    if (!popupEl) return;
    
    const popupHeight = popupEl.offsetHeight;
    const markerPoint = map.latLngToContainerPoint(marker.getLatLng());
    
    // Décalage vers le haut (popup au-dessus du marker)
    const offsetPoint = L.point(
        markerPoint.x,
        markerPoint.y - popupHeight / 2
    );
    
    const targetLatLng = map.containerPointToLatLng(offsetPoint);
    
    map.panTo(targetLatLng, {
        animate: true,
        duration: 0.3
    });
}

function waitForPopupImages(popup) {
    return new Promise(resolve => {
        const container = popup.getElement();
        if (!container) {
            resolve();
            return;
        }
        
        const images = Array.from(container.querySelectorAll('img'));
        
        if (images.length === 0) {
            resolve();
            return;
        }
        
        let loaded = 0;
        
        const check = () => {
            loaded++;
            if (loaded === images.length) {
                resolve();
            }
        };
        
        images.forEach(img => {
            if (img.complete && img.naturalWidth !== 0) {
                check();
            } else {
                img.addEventListener('load', check, { once: true });
                img.addEventListener('error', check, { once: true });
            }
        });
    });
}


/**
* Convert a hex color to an RGB string (``r,g,b``).
* @param {string} hex Hex color string, with or without leading `#`.
* @returns {string} Comma separated RGB values (e.g. "255,0,0").
*/
function hexToRgb(hex) {
    const v = String(hex || '').replace('#', '');
    const bigint = parseInt(v, 16) || 0;
    return [
        (bigint >> 16) & 255,
        (bigint >> 8) & 255,
        bigint & 255
    ].join(',');
}

/**
* Create a GeoJSON layer and grouped feature groups from the provided data.
* @param {L.Map} map Leaflet map instance.
* @param {Object} geojson GeoJSON FeatureCollection or array of features.
* @param {Object} categoryMap Map of category slug => {name, color}.
* @returns {{layer: L.GeoJSON, groups: Object, allGroup: L.FeatureGroup}}
*/
function createGeoJsonLayer(map, geojson, categoryMap) {
    const groups = {};
    const staticGroup = L.featureGroup().addTo(map);
    const allGroup = L.featureGroup().addTo(map);
    
    
    const layer = L.geoJSON(geojson, {
        style(feature) {
            return {
                color: feature.properties.stroke || feature.properties.color,
                weight: feature.properties['stroke-width'] || feature.properties.weight || 5,
                dashArray: feature.properties.dash || null,
                opacity: feature.properties.opacity || 1,
                fillOpacity: feature.properties['fill-opacity'] || 0.2,
                fillColor: feature.properties.fill || feature.properties.color || 'white'
            };
        },
        
        pointToLayer(feature, latlng) {
            const p = feature.properties;
            const category = categoryMap[p.term] || categoryMap.default;
            p.color = category.color;
            
            return L.marker(latlng, {
                icon: createSvgIcon(
                    feature.properties.color,
                    feature.properties.icon
                )
            });
        },
        
        onEachFeature(feature, layer) {
            const p = feature.properties;
            const category = categoryMap[p.term] || categoryMap.default;
            
            if (!p.nopopup) {
                const popup = buildPopup(p, category);
                
                layer.bindPopup(popup, {
                    autoPan: false,
                    maxWidth: 300,
                    minWidth: 200,
                    className: 'map-popup'
                });
                
                layer.on('popupopen', async () => {
                    const popup = layer.getPopup();
                    
                    await waitForPopupImages(popup);
                    
                    panToPopup(layer, map);
                });
            } else {
                layer.options.interactive = false;
            }
            
            if (!groups[p.term]) {
                groups[p.term] = L.featureGroup();
            }
            
            if (p.term === 'default' || p.term === 'static') {
                staticGroup.addLayer(layer);
            } else {
                groups[p.term].addLayer(layer);
                allGroup.addLayer(layer);
            }
            
        }
    });
    
    return { layer, groups, allGroup, staticGroup };
}

function createSvgIcon(color, type = 'custom') {
    const svg = SVG_ICONS[type]?.(color) || SVG_ICONS.custom(color);
    
    return L.divIcon({
        className: 'svg-marker',
        html: svg,
        iconSize: [32, 42],
        iconAnchor: [16, 42],
        popupAnchor: [0, -42]
    });
}

/**
* Initialize the map instance with base layers and attribution.
* @returns {L.Map}
*/

function initMap(el) {
    const map = L.map(el).setView([47.6675, -2.9838], 15);
    
    map.attributionControl.setPrefix(false);
    map.attributionControl
    .addAttribution('© OpenStreetMap')
    .addAttribution('© CARTO');
    
    map.on('popupopen', centerPopup);
    
    L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
        { subdomains: 'abcd', minZoom: 13, maxZoom: 18 }
    ).addTo(map);
    
    L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png',
        { subdomains: 'abcd', minZoom: 13, maxZoom: 18 }
    ).addTo(map);
    
    return map;
}

function centerPopup(e) {
    const px = e.target.project(e.popup.getLatLng());
    px.y -= e.popup._container.offsetHeight / 2;
    e.target.panTo(e.target.unproject(px), { animate: true });
}

/**
* Normalize an array of category objects into a map keyed by slug.
* @param {Array} categories Array of objects with {slug, color, name}.
* @returns {Object} Map of slug => {color, name}
*/

function normalizeCategories(categories = []) {
    return categories.reduce((acc, { slug, color, name }) => {
        acc[slug] = { color, name };
        return acc;
    }, {
        default: { color: '#333333', name: 'all' }
    });
}

/**
* Build HTML for a feature popup.
* @param {Object} item Feature properties.
* @param {Object} category Category object with {name, color}.
* @returns {string} HTML string for popup.
*/
function buildPopup(item, category) {
    return `
        <div class="leaflet-map-popup-category" style="--cat-rgb:${category.color}">
            <div class="leaflet-map-popup-category-name">${category.name}</div>
            <div class="leaflet-map-popup ${item.term}">
                ${item.image ? `<img class="leaflet-map-popup-image" src="${item.image}" alt="${item.title}" />` : ''}
                <div class="leaflet-map-popup-content">
                    <h3>${item.title}</h3>
                    <p>${item.excerpt}</p>
                    ${item.link !== "no" ? `<a href="${item.link}">Voir la fiche</a>` : ''}
                </div>
            </div>
        </div>
    `;
}

function clearMap(map) {
    Object.values(map._markerGroups).forEach(group => {
        if (map.hasLayer(group)) {
            map.removeLayer(group);
        }
    });
    
    if (map.hasLayer(map._allGroup)) {
        map.removeLayer(map._allGroup);
    }
}

function showAllCategories(map) {
    clearMap(map);
    
    map._allGroup.addTo(map);
    
    if (map._allGroup.getLayers().length) {
        map.flyToBounds(map._allGroup.getBounds(), fitBoundsOptions);
    }
}

function showCategory(map, term) {
    clearMap(map);
    
    const group = map._markerGroups[term];
    if (!group) return;
    
    group.addTo(map);
    
    if (group.getLayers().length) {
        map.flyToBounds(group.getBounds(), fitBoundsOptions);
    }
}

/**
* Set the active filter button state within a specific map container.
* @param {string} term Category term to activate
* @param {L.Map} map Leaflet map instance
*/
function setActiveFilter(term, map) {
    const wrapper = map.getContainer().closest('.leaflet-map-wrapper');
    if (!wrapper) return;
    
    wrapper.querySelectorAll('.leaflet-map-filter-cat').forEach(btn => {
        const isActive = btn.getAttribute('data-term') === term;
        btn.classList.toggle('is-active', isActive);
        btn.setAttribute('aria-pressed', isActive.toString());
    });
}

/**
* Render category filter buttons in a container.
* @param {Object} categoryMap Map of category slug => {name, color}
* @param {string} containerSelector CSS selector for container
* @param {L.Map} map Leaflet map instance
*/
function renderCategoryFilters(categoryMap, containerSelector, map) {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    
    container.innerHTML = '';
    container.setAttribute('role', 'group');
    container.setAttribute('aria-label', 'Filtrer la carte');
    
    Object.entries(categoryMap).forEach(([term, { name, color }]) => {
        const button = document.createElement('button');
        
        button.type = 'button';
        button.className = 'leaflet-map-filter-cat';
        button.dataset.term = term;
        
        const label = term === 'default' || !name ? 'Tous' : name;
        button.textContent = label;
        
        const isDefault = term === 'default';
        
        button.classList.toggle('is-active', isDefault);
        button.setAttribute('aria-pressed', isDefault.toString());
        button.setAttribute('style', '--cat-rgb: ' + hexToRgb(color));
        
        container.appendChild(button);
    });
}

document.addEventListener("DOMContentLoaded", function () {
    // Support for multiple maps on the same page
    const mapContainers = document.querySelectorAll('.leaflet-map-container');
    
    if (mapContainers.length === 0) return;
    
    mapContainers.forEach((containerEl) => {
        const wrapper = containerEl.closest('.leaflet-map-wrapper');
        if (!wrapper) return;
        
        const mapId = wrapper.getAttribute('data-map-id') || 'map-' + Math.random().toString(36).substr(2, 9);
        const filtersId = mapId + '-filters';
        
        // Check if mapData exists and is valid
        if (!window.mapData?.geojson) return;
        
        const map = initMap(containerEl);
        const categoryMap = normalizeCategories(window.mapData.categories);
        
        const { layer, groups, allGroup, staticGroup } =
        createGeoJsonLayer(map, window.mapData.geojson, categoryMap);
        
        map._staticGroup = staticGroup;
        map._markerGroups = groups;
        map._allGroup = allGroup;
        map._mapId = mapId;
        
        if (allGroup.getLayers().length) {
            map.flyToBounds(allGroup.getBounds(), fitBoundsOptions);
        }
        
        const filtersContainer = document.getElementById(filtersId);
        if (filtersContainer) {
            renderCategoryFilters(categoryMap, '#' + filtersId, map);
            showAllCategories(map);
            setActiveFilter('default', map);
            
            filtersContainer.querySelectorAll('.leaflet-map-filter-cat').forEach(btn => {
                btn.addEventListener('click', () => {
                    const term = btn.dataset.term;
                    setActiveFilter(term, map);
                    
                    term === 'default'
                    ? showAllCategories(map)
                    : showCategory(map, term);
                });
            });
        }
    });
});
