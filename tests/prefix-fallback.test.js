const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('path');

const root = path.join(__dirname, '..');
const helpersSrc = fs.readFileSync(path.join(root, 'includes/helpers.php'), 'utf8');
const dataSrc = fs.readFileSync(path.join(root, 'includes/data.php'), 'utf8');
const metaboxSrc = fs.readFileSync(path.join(root, 'includes/metabox-place.php'), 'utf8');
const termSrc = fs.readFileSync(path.join(root, 'includes/term-data.php'), 'utf8');

function metaIsSet(value) {
  return value !== '' && value !== false && value !== null && value !== undefined;
}

/**
 * Mirrors leaflet_map_get_post_meta() / leaflet_map_get_term_meta().
 * `store` is a map of full meta key => value for one post or term.
 */
function readMeta(store, currentPrefix, key) {
  const currentKey = `${currentPrefix}_${key}`;
  const value = Object.prototype.hasOwnProperty.call(store, currentKey)
    ? store[currentKey]
    : '';
  if (metaIsSet(value)) {
    return value;
  }

  const legacyKey = `leaflet_${key}`;
  if (legacyKey === currentKey) {
    return value;
  }

  const legacy = Object.prototype.hasOwnProperty.call(store, legacyKey)
    ? store[legacyKey]
    : '';
  return metaIsSet(legacy) ? legacy : value;
}

test('changing prefix used to hide stored leaflet_ coordinates from the map query', () => {
  const store = {
    leaflet_latitude: '48.8566',
    leaflet_longitude: '2.3522',
  };

  assert.equal(readMeta(store, 'leaflet', 'latitude'), '48.8566');
  assert.equal(readMeta(store, 'mcs', 'latitude'), '48.8566');
  assert.equal(readMeta(store, 'mcs', 'longitude'), '2.3522');
});

test('current prefix wins over the default leaflet_ key', () => {
  const store = {
    leaflet_latitude: '48.8566',
    mcs_latitude: '51.5074',
  };

  assert.equal(readMeta(store, 'mcs', 'latitude'), '51.5074');
});

test('numeric zero is kept so equator and prime meridian still resolve', () => {
  const store = {
    leaflet_latitude: '0',
    leaflet_longitude: '0',
  };

  assert.equal(readMeta(store, 'mcs', 'latitude'), '0');
  assert.equal(readMeta(store, 'mcs', 'longitude'), '0');
});

test('missing keys stay empty so places without coordinates are still skipped', () => {
  assert.equal(readMeta({}, 'mcs', 'latitude'), '');
  assert.equal(readMeta({ mcs_latitude: '' }, 'mcs', 'geojson'), '');
});

test('helpers fall back to the default leaflet_ prefix', () => {
  assert.match(helpersSrc, /function leaflet_map_get_post_meta\s*\(/);
  assert.match(helpersSrc, /function leaflet_map_get_term_meta\s*\(/);
  assert.match(helpersSrc, /leaflet_map_default_prefix\(\)\s*\.\s*'_'\s*\.\s*\$key/);
  assert.match(helpersSrc, /leaflet_map_meta_is_set/);
});

test('map export and editors read through the fallback helpers', () => {
  assert.match(dataSrc, /leaflet_map_get_post_meta\(\$pid,\s*'latitude'\)/);
  assert.match(dataSrc, /leaflet_map_get_post_meta\(\$pid,\s*'longitude'\)/);
  assert.match(dataSrc, /leaflet_map_get_post_meta\(\$pid,\s*'geojson'\)/);
  assert.match(dataSrc, /leaflet_map_get_term_meta\(/);
  assert.match(metaboxSrc, /leaflet_map_get_post_meta\(\$post->ID,\s*"latitude"\)/);
  assert.match(termSrc, /leaflet_map_get_term_meta\(\$term->term_id,\s*'cat_place_color'\)/);

  assert.equal(
    /get_post_meta\(\$pid,\s*leaflet_map_meta_key\('latitude'\)/.test(dataSrc),
    false
  );
});
