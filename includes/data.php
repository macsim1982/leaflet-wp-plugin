<?php

function leaflet_map_normalize_geojson($geojson) {
	if (is_string($geojson)) {
		$geojson = json_decode($geojson, true);
	}

	if (!$geojson || !is_array($geojson)) {
		return [];
	}

	// Case 1: FeatureCollection
	if (($geojson['type'] ?? '') === 'FeatureCollection') {
		return $geojson['features'] ?? [];
	}

	// Case 2: Feature
	if (($geojson['type'] ?? '') === 'Feature') {
		return [$geojson];
	}

	// Case 3: Geometry only
	if (isset($geojson['type'], $geojson['coordinates'])) {
		return [[
			'type' => 'Feature',
			'geometry' => $geojson,
			'properties' => []
		]];
	}

	return [];
}

/**
 * Resolve a Place's GeoJSON features, falling back to lat/lng when GeoJSON
 * is missing or does not yield any features.
 *
 * A non-empty GeoJSON textarea used to skip the coordinate Point entirely.
 * Invalid JSON, `{}`, or an empty FeatureCollection then dropped a published
 * Place from mapData even when latitude/longitude were set.
 *
 * @param mixed $geojson Raw geojson post meta (string or already-decoded).
 * @param mixed $lat Raw latitude post meta.
 * @param mixed $lng Raw longitude post meta.
 * @return array List of GeoJSON Feature arrays.
 */
function leaflet_map_place_raw_features($geojson, $lat, $lng) {
	$raw_features = [];

	if ($geojson) {
		$raw_features = leaflet_map_normalize_geojson($geojson);
	}

	if ($raw_features) {
		return $raw_features;
	}

	if (!is_numeric($lat) || !is_numeric($lng)) {
		return [];
	}

	return [[
		'type' => 'Feature',
		'geometry' => [
			'type' => 'Point',
			'coordinates' => [(float) $lng, (float) $lat],
		],
		'properties' => [],
	]];
}

add_action('wp_enqueue_scripts', function () {

	$args = [
		'post_type'      => leaflet_map_post_type(),
		'posts_per_page' => -1,
		'post_status'    => current_user_can('administrator')
        ? ['publish', 'private', 'draft', 'pending', 'future']
        : ['publish'],
	];

	$query = new WP_Query($args);

	$features   = [];
	$categories = [];

	while ($query->have_posts()) {
		$query->the_post();

		$pid = get_the_ID();

		$lat     = get_post_meta($pid, leaflet_map_meta_key('latitude'), true);
		$lng     = get_post_meta($pid, leaflet_map_meta_key('longitude'), true);
		$geojson = get_post_meta($pid, leaflet_map_meta_key('geojson'), true);
		$weight  = (int) get_post_meta($pid, leaflet_map_meta_key('line_weight'), true) ?: 5;

		if (!$geojson && (!$lat || !$lng)) {
			continue;
		}

		/* ----------------------------
		 * Catégorie
		 * ---------------------------- */
		$term_slug = 'default';
		$term_name = '';
		$color     = '#333333';

		$terms = get_the_terms($pid, leaflet_map_taxonomy());
		if ($terms && !is_wp_error($terms)) {
			$term = $terms[0];

			$term_slug = $term->slug;
			$term_name = $term->name;
			$color     = get_term_meta(
				$term->term_id,
				leaflet_map_meta_key('cat_place_color'),
				true
			) ?: $color;

			$categories[$term_slug] = [
				'slug'  => $term_slug,
				'name'  => $term_name,
				'color' => $color,
			];
		}

		/* ----------------------------
		 * Geometry
		 * ---------------------------- */
		$raw_features = leaflet_map_place_raw_features($geojson, $lat, $lng);


		/* ----------------------------
		 * Feature
		 * ---------------------------- */
		foreach ($raw_features as $raw_feature) {
			if (!isset($raw_feature['geometry'])) {
				continue;
			}

			$geoProps = $raw_feature['properties'] ?? [];

			$wpProps = [
				'id'        => $pid,
				'title'     => get_the_title(),
				'excerpt'   => get_the_excerpt(),
				'link'      => get_permalink(),
				'term'      => $term_slug,
				'term_name' => $term_name,
				'color'     => $color,
				'image'     => get_the_post_thumbnail_url($pid, 'medium'),
				'weight'    => $weight,
				'icon'      => 'custom',
			];

			$features[] = [
				'type'       => 'Feature',
				'geometry'   => $raw_feature['geometry'],
				'properties' => $geoProps + $wpProps
			];
		}


	}

	wp_reset_postdata();

	wp_localize_script(
		'leaflet-map-init',
		'mapData',
		[
			'geojson'    => [
				'type'     => 'FeatureCollection',
				'features' => $features,
			],
			'categories' => array_values($categories),
		]
	);
});
