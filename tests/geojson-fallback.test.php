<?php
/**
 * @param mixed $condition
 * @param string $message
 */
function leaflet_map_test_assert($condition, $message) {
	if (!$condition) {
		fwrite(STDERR, "FAIL: {$message}\n");
		exit(1);
	}
}

function get_option($key, $default = []) {
	return $default;
}

function sanitize_key($key) {
	return $key;
}

function add_action($hook, $callback, $priority = 10, $accepted_args = 1) {
}

require __DIR__ . '/../includes/helpers.php';
require __DIR__ . '/../includes/data.php';

function leaflet_map_test_is_point_fallback($features, $lng, $lat) {
	leaflet_map_test_assert(is_array($features) && count($features) === 1, 'fallback yields one feature');
	leaflet_map_test_assert(($features[0]['geometry']['type'] ?? null) === 'Point', 'fallback is a Point');
	leaflet_map_test_assert(
		($features[0]['geometry']['coordinates'] ?? null) === [(float) $lng, (float) $lat],
		'fallback uses longitude, latitude order'
	);
}

$lat = '48.8584';
$lng = '2.2945';

foreach ([
	'invalid json' => '{',
	'empty object' => '{}',
	'empty FeatureCollection' => '{"type":"FeatureCollection","features":[]}',
	'non-geojson object' => '{"foo":"bar"}',
	'json null' => 'null',
	'whitespace junk' => 'not json',
] as $label => $geojson) {
	$features = leaflet_map_place_raw_features($geojson, $lat, $lng);
	leaflet_map_test_is_point_fallback($features, $lng, $lat);
	leaflet_map_test_assert(true, "{$label}: fell back to lat/lng instead of dropping the place");
}

$empty = leaflet_map_place_raw_features('', $lat, $lng);
leaflet_map_test_is_point_fallback($empty, $lng, $lat);

$missing = leaflet_map_place_raw_features('{', '', '');
leaflet_map_test_assert($missing === [], 'invalid geojson with no coordinates still yields nothing');

$point = leaflet_map_place_raw_features(
	'{"type":"Point","coordinates":[-1.55,47.22]}',
	$lat,
	$lng
);
leaflet_map_test_assert(count($point) === 1, 'valid geometry-only geojson is kept');
leaflet_map_test_assert(
	($point[0]['geometry']['coordinates'] ?? null) === [-1.55, 47.22],
	'valid geojson is not replaced by lat/lng'
);

$collection = leaflet_map_place_raw_features(
	'{"type":"FeatureCollection","features":[{"type":"Feature","geometry":{"type":"Point","coordinates":[-1.55,47.22]},"properties":{}}]}',
	$lat,
	$lng
);
leaflet_map_test_assert(count($collection) === 1, 'valid FeatureCollection is kept');
leaflet_map_test_assert(
	($collection[0]['geometry']['coordinates'] ?? null) === [-1.55, 47.22],
	'valid FeatureCollection coordinates are preserved'
);

$dataSrc = file_get_contents(__DIR__ . '/../includes/data.php');
leaflet_map_test_assert(
	str_contains($dataSrc, 'leaflet_map_place_raw_features($geojson, $lat, $lng)'),
	'public map export uses the geojson/lat-lng fallback helper'
);

echo "ok\n";
