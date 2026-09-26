const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const helpersSrc = fs.readFileSync(path.join(root, 'includes/helpers.php'), 'utf8');
const dataSrc = fs.readFileSync(path.join(root, 'includes/data.php'), 'utf8');
const mapInitSrc = fs.readFileSync(path.join(root, 'assets/js/map-init.js'), 'utf8');

function isFiniteCoordinate(value) {
  return value !== '' && value !== null && Number.isFinite(Number(value));
}

function isValidPosition(coords) {
  return Array.isArray(coords)
    && isFiniteCoordinate(coords[0])
    && isFiniteCoordinate(coords[1]);
}

function isValidPositionList(coords, depth) {
  if (!Array.isArray(coords) || coords.length === 0) {
    return false;
  }
  if (depth === 0) {
    return isValidPosition(coords);
  }
  return coords.every((item) => isValidPositionList(item, depth - 1));
}

function isValidGeometry(geometry) {
  if (!geometry || typeof geometry !== 'object') {
    return false;
  }

  if (geometry.type === 'GeometryCollection') {
    return Array.isArray(geometry.geometries)
      && geometry.geometries.length > 0
      && geometry.geometries.every(isValidGeometry);
  }

  if (!geometry.type || geometry.coordinates == null) {
    return false;
  }

  switch (geometry.type) {
    case 'Point':
      return isValidPosition(geometry.coordinates);
    case 'MultiPoint':
    case 'LineString':
      return isValidPositionList(geometry.coordinates, 1);
    case 'MultiLineString':
    case 'Polygon':
      return isValidPositionList(geometry.coordinates, 2);
    case 'MultiPolygon':
      return isValidPositionList(geometry.coordinates, 3);
    default:
      return false;
  }
}

function sanitizeGeoJson(geojson) {
  const features = Array.isArray(geojson)
    ? geojson
    : Array.isArray(geojson?.features)
      ? geojson.features
      : [];

  return {
    type: 'FeatureCollection',
    features: features.filter((feature) => isValidGeometry(feature?.geometry)),
  };
}

/**
 * Mirrors Leaflet 1.9 LatLng + coordsToLatLng: throws when a position
 * cannot be turned into a finite lat/lng. This is what used to kill
 * the whole public map during L.geoJSON().
 */
function leafletCoordsToLatLng(coords) {
  if (coords == null) {
    throw new TypeError('Cannot read coordinates');
  }
  const lat = coords[1];
  const lng = coords[0];
  if (isNaN(lat) || isNaN(lng)) {
    throw new Error('Invalid LatLng object: (' + lat + ', ' + lng + ')');
  }
  return { lat: +lat, lng: +lng };
}

test('valid point, line, and polygon geometries are kept', () => {
  assert.equal(isValidGeometry({ type: 'Point', coordinates: [-2.98, 47.67] }), true);
  assert.equal(isValidGeometry({ type: 'Point', coordinates: ['0', '0'] }), true);
  assert.equal(isValidGeometry({
    type: 'LineString',
    coordinates: [[-2.98, 47.67], [-2.97, 47.68]],
  }), true);
  assert.equal(isValidGeometry({
    type: 'Polygon',
    coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]],
  }), true);
});

test('incomplete or non-numeric coordinates are rejected', () => {
  assert.equal(isValidGeometry({ type: 'Point' }), false);
  assert.equal(isValidGeometry({ type: 'Point', coordinates: [] }), false);
  assert.equal(isValidGeometry({ type: 'Point', coordinates: [-2.98] }), false);
  assert.equal(isValidGeometry({ type: 'Point', coordinates: ['lng', 'lat'] }), false);
  assert.equal(isValidGeometry({ type: 'LineString', coordinates: [] }), false);
  assert.equal(isValidGeometry({ type: 'LineString', coordinates: [[]] }), false);
  assert.equal(isValidGeometry({ type: 'Feature' }), false);
});

test('one bad feature does not discard the rest of the collection', () => {
  const sanitized = sanitizeGeoJson({
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [] },
        properties: { title: 'broken' },
      },
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [-2.98, 47.67] },
        properties: { title: 'ok' },
      },
    ],
  });

  assert.equal(sanitized.features.length, 1);
  assert.equal(sanitized.features[0].properties.title, 'ok');
});

test('Leaflet throws on the geometries we now drop — that used to take down the map', () => {
  assert.throws(() => leafletCoordsToLatLng([]), /Invalid LatLng/);
  assert.throws(() => leafletCoordsToLatLng([-2.98]), /Invalid LatLng/);
  assert.throws(() => leafletCoordsToLatLng(undefined), /coordinates/);
  assert.doesNotThrow(() => leafletCoordsToLatLng([-2.98, 47.67]));
});

test('PHP helper rejects invalid geometry and is used when exporting mapData', () => {
  assert.match(helpersSrc, /function leaflet_map_geometry_is_valid\s*\(/);
  assert.match(helpersSrc, /function leaflet_map_is_position\s*\(/);
  assert.match(dataSrc, /leaflet_map_geometry_is_valid/);
  assert.match(dataSrc, /is_numeric\(\$lat\) && is_numeric\(\$lng\)/);
});

test('map init sanitizes GeoJSON before handing it to Leaflet', () => {
  assert.match(mapInitSrc, /function sanitizeGeoJson\s*\(/);
  assert.match(mapInitSrc, /L\.geoJSON\(\s*sanitizeGeoJson\(\s*geojson\s*\)/);
});
