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
 * Post statuses allowed in the public `mapData` payload.
 *
 * Draft / private / pending / future Places must stay out of this script
 * even when an administrator is viewing the front-end. `mapData` is printed
 * on every page via `wp_localize_script`; page caches that do not vary on
 * auth cookies would otherwise serve unpublished titles, excerpts, links,
 * and coordinates to anonymous visitors.
 *
 * @return string
 */
function leaflet_map_public_map_post_status() {
	return 'publish';
}
