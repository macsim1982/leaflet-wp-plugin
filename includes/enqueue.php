<?php
add_action('admin_enqueue_scripts', function ($hook) {

	if (!in_array($hook, ['edit-tags.php', 'term.php'])) {
		return;
	}

	wp_enqueue_style('wp-color-picker');
	wp_enqueue_script('wp-color-picker');

	wp_enqueue_script(
		'leaflet-admin',
		LEAFLET_MAP_URL . 'assets/js/admin.js',
		['wp-color-picker'],
		'1.0',
		true
	);
});

/**
 * Enqueue front-end Leaflet assets.
 *
 * Called from the shortcode so CSS/JS are not loaded on pages without a map.
 * Safe during content render because the scripts print in the footer.
 */
function leaflet_map_enqueue_frontend_assets() {
	wp_enqueue_style(
		'leaflet-css',
		LEAFLET_MAP_URL . 'assets/css/leaflet.css',
		[],
		'1.9.4'
	);

	wp_enqueue_script(
		'leaflet-js',
		LEAFLET_MAP_URL . 'assets/js/leaflet.js',
		[],
		'1.9.4',
		true
	);

	wp_enqueue_style(
		'leaflet-map-css',
		LEAFLET_MAP_URL . 'assets/css/map.css',
		[],
		'1.0.0'
	);

	wp_enqueue_script(
		'leaflet-map-init',
		LEAFLET_MAP_URL . 'assets/js/map-init.js',
		['leaflet-js'],
		'1.0.0',
		true
	);
}
