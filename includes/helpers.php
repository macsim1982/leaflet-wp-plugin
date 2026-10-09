<?php

function leaflet_map_settings() {
	return get_option('leaflet_map_settings', []);
}

function leaflet_map_prefix() {
	$settings = leaflet_map_settings();
	return sanitize_key($settings['prefix'] ?? 'leaflet');
}

function leaflet_map_post_type() {
	$settings = leaflet_map_settings();
	return sanitize_key($settings['post_type'] ?? 'place');
}

function leaflet_map_meta_key(string $key): string {
	return leaflet_map_prefix() . '_' . $key;
}

function leaflet_map_taxonomy() {
	$settings = leaflet_map_settings();
	return sanitize_key($settings['taxonomy'] ?? 'cat_place');
}

/**
 * Coerce a GeoJSON Feature "properties" value to an array.
 *
 * RFC 7946 allows null; exporters and hand-edited textarea input sometimes
 * store a string/number/bool instead of an object. PHP 8 throws TypeError on
 * `$geoProps + $wpProps` unless both operands are arrays, which fatals
 * wp_enqueue_scripts on every front-end page.
 *
 * @param mixed $properties
 * @return array
 */
function leaflet_map_feature_properties($properties): array {
	return is_array($properties) ? $properties : [];
}
