const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const root = join(__dirname, '..');

function read(rel) {
  return readFileSync(join(root, rel), 'utf8');
}

describe('front-end map payload is gated on the shortcode', () => {
  it('does not enqueue Leaflet or localize mapData on every public page', () => {
    const enqueue = read('includes/enqueue.php');
    const data = read('includes/data.php');

    assert.equal(
      enqueue.includes("add_action('wp_enqueue_scripts'"),
      false,
      'enqueue.php must not hook wp_enqueue_scripts'
    );
    assert.equal(
      data.includes("add_action('wp_enqueue_scripts'"),
      false,
      'data.php must not hook wp_enqueue_scripts'
    );
  });

  it('loads assets and mapData from the shortcode callback', () => {
    const shortcode = read('includes/shortcode.php');

    assert.match(shortcode, /leaflet_map_enqueue_frontend_assets\s*\(/);
    assert.match(shortcode, /leaflet_map_localize_data\s*\(/);
  });

  it('localizes mapData only once per request', () => {
    const data = read('includes/data.php');

    assert.match(data, /function leaflet_map_localize_data\s*\(/);
    assert.match(data, /static \$done/);
  });
});
