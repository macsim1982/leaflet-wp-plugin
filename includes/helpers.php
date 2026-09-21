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
 * Password-protected places must not appear in the public map payload.
 *
 * WordPress stores them as `publish` + a non-empty `post_password`. Core
 * hides the single-post body behind a password form, but WP_Query still
 * returns them unless `has_password` is false.
 *
 * @param string $post_password Raw `post_password` field (empty if unlocked/public).
 * @return bool
 */
function leaflet_map_is_password_protected_post($post_password) {
	return is_string($post_password) && $post_password !== '';
}
