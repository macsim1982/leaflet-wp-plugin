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
 * True when latitude/longitude are usable map coordinates.
 *
 * Zero is valid (equator / prime meridian). Empty strings and other
 * non-numeric values are not — those mean "not set" in post meta.
 *
 * @param mixed $lat Raw latitude meta value.
 * @param mixed $lng Raw longitude meta value.
 * @return bool
 */
function leaflet_map_has_coordinates($lat, $lng) {
	return is_numeric($lat) && is_numeric($lng);
}
