const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const helpersSrc = fs.readFileSync(path.join(root, 'includes/helpers.php'), 'utf8');
const dataSrc = fs.readFileSync(path.join(root, 'includes/data.php'), 'utf8');

/**
 * Mirrors leaflet_map_is_password_protected_post(): a Place with a
 * non-empty post_password is password-protected even when status is publish.
 */
function isPasswordProtectedPost(postPassword) {
	return typeof postPassword === 'string' && postPassword !== '';
}

test('empty or missing post_password is publicly listable', () => {
	assert.equal(isPasswordProtectedPost(''), false);
	assert.equal(isPasswordProtectedPost(null), false);
	assert.equal(isPasswordProtectedPost(undefined), false);
});

test('non-empty post_password is treated as password-protected', () => {
	assert.equal(isPasswordProtectedPost('secret'), true);
	assert.equal(isPasswordProtectedPost('0'), true);
});

test('helper exists and treats only a non-empty string as protected', () => {
	assert.match(helpersSrc, /function leaflet_map_is_password_protected_post\s*\(\s*\$post_password\s*\)/);
	assert.match(helpersSrc, /is_string\(\$post_password\) && \$post_password !== ''/);
});

test('public map query excludes password-protected posts', () => {
	assert.match(dataSrc, /'has_password'\s*=>\s*false/);
	assert.match(
		dataSrc,
		/leaflet_map_is_password_protected_post\(\s*get_post_field\(\s*'post_password'/
	);
});
