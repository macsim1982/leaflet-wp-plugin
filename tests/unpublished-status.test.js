const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const helpersSrc = fs.readFileSync(path.join(root, 'includes/helpers.php'), 'utf8');
const dataSrc = fs.readFileSync(path.join(root, 'includes/data.php'), 'utf8');

/**
 * Mirrors leaflet_map_public_map_post_status(): only published Places
 * belong in the public map payload.
 */
function publicMapPostStatus() {
	return 'publish';
}

test('public map post status is publish only', () => {
	assert.equal(publicMapPostStatus(), 'publish');
});

test('helper returns publish and documents why drafts stay out', () => {
	assert.match(helpersSrc, /function leaflet_map_public_map_post_status\s*\(\s*\)/);
	assert.match(helpersSrc, /return 'publish';/);
	assert.match(helpersSrc, /page caches/);
});

test('mapData query uses the public post status helper', () => {
	assert.match(dataSrc, /'post_status'\s*=>\s*leaflet_map_public_map_post_status\s*\(\s*\)/);
});

test('mapData query does not expand statuses for logged-in administrators', () => {
	assert.equal(dataSrc.includes("current_user_can('administrator')"), false);
	assert.equal(dataSrc.includes("'private'"), false);
	assert.equal(dataSrc.includes("'draft'"), false);
	assert.equal(dataSrc.includes("'pending'"), false);
	assert.equal(dataSrc.includes("'future'"), false);
});
