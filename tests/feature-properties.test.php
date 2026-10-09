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

$wpProps = [
	'title' => 'Place',
	'term' => 'default',
	'link' => 'https://example.com/place',
];

$invalid = [
	'string' => 'Nantes',
	'bool' => false,
	'int' => 0,
	'float' => 1.5,
	'null' => null,
];

foreach ($invalid as $label => $properties) {
	$geoProps = leaflet_map_feature_properties($properties);
	leaflet_map_test_assert(is_array($geoProps), "{$label}: coerced value is an array");

	try {
		$merged = $geoProps + $wpProps;
	} catch (Throwable $e) {
		fwrite(STDERR, "FAIL: {$label}: union threw {$e->getMessage()}\n");
		exit(1);
	}

	leaflet_map_test_assert(
		($merged['title'] ?? null) === 'Place',
		"{$label}: WordPress title is preserved when GeoJSON properties are invalid"
	);
}

$geoProps = leaflet_map_feature_properties([
	'name' => 'park',
	'title' => 'GeoTitle',
]);
$merged = $geoProps + $wpProps;

leaflet_map_test_assert($merged['title'] === 'GeoTitle', 'GeoJSON title still overrides WordPress title');
leaflet_map_test_assert($merged['name'] === 'park', 'custom GeoJSON properties are kept');
leaflet_map_test_assert($merged['term'] === 'default', 'WordPress keys missing from GeoJSON are filled in');

$feature = json_decode(
	'{"type":"Feature","geometry":{"type":"Point","coordinates":[-1.55,47.22]},"properties":"Nantes"}',
	true
);
$geoProps = leaflet_map_feature_properties($feature['properties'] ?? null);
$merged = $geoProps + $wpProps;
leaflet_map_test_assert(
	($merged['title'] ?? null) === 'Place',
	'hand-edited Feature with string properties does not fatal'
);

$collection = leaflet_map_normalize_geojson([
	'type' => 'FeatureCollection',
	'features' => 'oops',
]);
leaflet_map_test_assert($collection === [], 'non-array FeatureCollection features become []');

$normalized = leaflet_map_normalize_geojson($feature);
leaflet_map_test_assert(
	count($normalized) === 1 && ($normalized[0]['properties'] ?? null) === 'Nantes',
	'normalize still returns the Feature so export can coerce properties'
);

$wpProps = [
	'title' => 'Place',
	'term' => 'default',
	'link' => 'https://example.com/place',
];
$features = [];
foreach ($normalized as $raw_feature) {
	if (!is_array($raw_feature) || !isset($raw_feature['geometry'])) {
		continue;
	}
	$geoProps = leaflet_map_feature_properties($raw_feature['properties'] ?? null);
	$features[] = [
		'type' => 'Feature',
		'geometry' => $raw_feature['geometry'],
		'properties' => $geoProps + $wpProps,
	];
}
leaflet_map_test_assert(count($features) === 1, 'export keeps a Feature with invalid properties');
leaflet_map_test_assert($features[0]['properties']['title'] === 'Place', 'export fills WordPress props after coerce');

echo "ok\n";
