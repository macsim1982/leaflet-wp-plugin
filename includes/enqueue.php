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

add_action('wp_enqueue_scripts', function () {

	// Leaflet
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

    // CSS métier
    wp_enqueue_style(
		'leaflet-map-css',
		LEAFLET_MAP_URL . 'assets/css/map.css',
		[],
		'1.0.0'
	);

	// JS métier
	wp_enqueue_script(
		'leaflet-map-init',
		LEAFLET_MAP_URL . 'assets/js/map-init.js',
		['leaflet-js'],
		'1.0.0',
		true
	);
});
