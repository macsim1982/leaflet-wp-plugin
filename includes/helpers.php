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
 * Default meta-key prefix used before "Préfixe des champs" is customized.
 */
function leaflet_map_default_prefix(): string {
	return 'leaflet';
}

/**
 * True when a get_*_meta() result represents a stored value.
 *
 * Empty string / false / null mean "not set". Numeric zero must count as set
 * so equator / prime-meridian coordinates are not treated as missing.
 *
 * @param mixed $value Raw meta value.
 * @return bool
 */
function leaflet_map_meta_is_set($value): bool {
	return $value !== '' && $value !== false && $value !== null;
}

/**
 * Read plugin post meta, falling back to the default `leaflet_{$key}` key.
 *
 * Changing the settings prefix would otherwise orphan existing coordinates
 * and GeoJSON, which empties the public map.
 *
 * @param int    $post_id Post ID.
 * @param string $key     Unprefixed meta field (`latitude`, `geojson`, …).
 * @return mixed
 */
function leaflet_map_get_post_meta($post_id, string $key) {
	$current_key = leaflet_map_meta_key($key);
	$value = get_post_meta($post_id, $current_key, true);
	if (leaflet_map_meta_is_set($value)) {
		return $value;
	}

	$legacy_key = leaflet_map_default_prefix() . '_' . $key;
	if ($legacy_key === $current_key) {
		return $value;
	}

	$legacy = get_post_meta($post_id, $legacy_key, true);
	return leaflet_map_meta_is_set($legacy) ? $legacy : $value;
}

/**
 * Read plugin term meta, falling back to the default `leaflet_{$key}` key.
 *
 * @param int    $term_id Term ID.
 * @param string $key     Unprefixed meta field (`cat_place_color`, …).
 * @return mixed
 */
function leaflet_map_get_term_meta($term_id, string $key) {
	$current_key = leaflet_map_meta_key($key);
	$value = get_term_meta($term_id, $current_key, true);
	if (leaflet_map_meta_is_set($value)) {
		return $value;
	}

	$legacy_key = leaflet_map_default_prefix() . '_' . $key;
	if ($legacy_key === $current_key) {
		return $value;
	}

	$legacy = get_term_meta($term_id, $legacy_key, true);
	return leaflet_map_meta_is_set($legacy) ? $legacy : $value;
}
