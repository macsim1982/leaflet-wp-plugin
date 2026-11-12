<?php

/**
 * Register the Place post type and category taxonomy.
 *
 * Called on `init` and from the activation hook so rewrite rules
 * can be flushed with the CPT already registered.
 */
function leaflet_map_register_content_types() {
	$post_type = leaflet_map_post_type();
	$taxonomy = leaflet_map_taxonomy();

	if (post_type_exists($post_type)) {
		return;
	}

	register_post_type($post_type, [
		'label' => 'Lieux',
		'public' => true,
		'show_in_rest' => true,
		'has_archive' => false,
		'menu_icon' => 'dashicons-location',
		'supports' => ['title', 'editor', 'thumbnail'],
		'rewrite' => ['slug' => 'lieu'],
	]);

	if (taxonomy_exists($taxonomy)) {
		return;
	}

	register_taxonomy($taxonomy, $post_type, [
		'label' => 'Catégories de lieux',
		'public' => true,
		'show_in_rest' => true,
		'hierarchical' => true,
		'rewrite' => ['slug' => 'categorie-lieu'],
	]);
}

add_action('init', 'leaflet_map_register_content_types');
