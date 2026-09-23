const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const helpersSrc = fs.readFileSync(path.join(root, 'includes/helpers.php'), 'utf8');
const dataSrc = fs.readFileSync(path.join(root, 'includes/data.php'), 'utf8');

/**
 * Mirrors PHP is_numeric() for the values WordPress post meta actually stores:
 * strings from number inputs ("0", "51.48", "") and empty/missing meta.
 */
function isNumeric(value) {
	if (typeof value === 'number') {
		return Number.isFinite(value);
	}
	if (typeof value !== 'string' || value.trim() === '') {
		return false;
	}
	return Number.isFinite(Number(value));
}

/**
 * Mirrors leaflet_map_has_coordinates().
 */
function hasCoordinates(lat, lng) {
	return isNumeric(lat) && isNumeric(lng);
}

/**
 * Old skip condition: `!$geojson && (!$lat || !$lng)` using PHP truthiness.
 * In PHP, "0" and 0 are falsy.
 */
function phpFalsy(value) {
	return value === '' || value === 0 || value === '0' || value === null || value === false || value === undefined;
}

function oldSkipPlace(lat, lng, geojson) {
	return phpFalsy(geojson) && (phpFalsy(lat) || phpFalsy(lng));
}

function newSkipPlace(lat, lng, geojson) {
	return phpFalsy(geojson) && !hasCoordinates(lat, lng);
}

test('equator and prime meridian are valid coordinates', () => {
	assert.equal(hasCoordinates(0, 30), true);
	assert.equal(hasCoordinates('0', '30'), true);
	assert.equal(hasCoordinates('51.48', '0'), true);
	assert.equal(hasCoordinates(51.48, 0), true);
	assert.equal(hasCoordinates('0', '0'), true);
});

test('missing or non-numeric meta is not a valid point', () => {
	assert.equal(hasCoordinates('', ''), false);
	assert.equal(hasCoordinates('', '2.3'), false);
	assert.equal(hasCoordinates('48.8', ''), false);
	assert.equal(hasCoordinates('abc', '2.3'), false);
	assert.equal(hasCoordinates(null, 2.3), false);
});

test('old truthiness check dropped published places on the equator or meridian', () => {
	assert.equal(oldSkipPlace('0', '30', ''), true);
	assert.equal(oldSkipPlace('51.48', '0', ''), true);
	assert.equal(oldSkipPlace('0', '0', ''), true);
	assert.equal(newSkipPlace('0', '30', ''), false);
	assert.equal(newSkipPlace('51.48', '0', ''), false);
	assert.equal(newSkipPlace('0', '0', ''), false);
	assert.equal(newSkipPlace('', '', ''), true);
	assert.equal(newSkipPlace('48.8', '2.3', ''), false);
});

test('helper uses is_numeric so zero is kept', () => {
	assert.match(helpersSrc, /function leaflet_map_has_coordinates\s*\(\s*\$lat\s*,\s*\$lng\s*\)/);
	assert.match(helpersSrc, /is_numeric\(\$lat\) && is_numeric\(\$lng\)/);
});

test('map export skips only when geojson and coordinates are both missing', () => {
	assert.match(dataSrc, /leaflet_map_has_coordinates\(\$lat,\s*\$lng\)/);
	assert.equal(/\(\s*!\$lat\s*\|\|\s*!\$lng\s*\)/.test(dataSrc), false);
});
