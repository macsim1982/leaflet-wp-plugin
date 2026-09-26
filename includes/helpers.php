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
 * True when $coords is a GeoJSON position: [lng, lat, …].
 *
 * @param mixed $coords
 * @return bool
 */
function leaflet_map_is_position($coords): bool {
	return is_array($coords)
		&& isset($coords[0], $coords[1])
		&& is_numeric($coords[0])
		&& is_numeric($coords[1]);
}

/**
 * True when $coords is a nested list of positions at the given depth.
 *
 * @param mixed $coords
 * @param int   $depth 0 = a position, 1 = list of positions, etc.
 * @return bool
 */
function leaflet_map_is_position_list($coords, int $depth): bool {
	if (!is_array($coords) || $coords === []) {
		return false;
	}

	if ($depth === 0) {
		return leaflet_map_is_position($coords);
	}

	foreach ($coords as $item) {
		if (!leaflet_map_is_position_list($item, $depth - 1)) {
			return false;
		}
	}

	return true;
}

/**
 * True when a GeoJSON geometry can be converted by Leaflet without throwing.
 *
 * Leaflet's geometryToLayer() calls LatLng() on each position and throws
 * "Invalid LatLng object" for missing or non-numeric coordinates — that
 * aborts L.geoJSON() for the entire FeatureCollection.
 *
 * @param mixed $geometry
 * @return bool
 */
function leaflet_map_geometry_is_valid($geometry): bool {
	if (!is_array($geometry) || empty($geometry['type'])) {
		return false;
	}

	if ($geometry['type'] === 'GeometryCollection') {
		if (empty($geometry['geometries']) || !is_array($geometry['geometries'])) {
			return false;
		}

		foreach ($geometry['geometries'] as $child) {
			if (!leaflet_map_geometry_is_valid($child)) {
				return false;
			}
		}

		return true;
	}

	if (!isset($geometry['coordinates'])) {
		return false;
	}

	switch ($geometry['type']) {
		case 'Point':
			return leaflet_map_is_position($geometry['coordinates']);
		case 'MultiPoint':
		case 'LineString':
			return leaflet_map_is_position_list($geometry['coordinates'], 1);
		case 'MultiLineString':
		case 'Polygon':
			return leaflet_map_is_position_list($geometry['coordinates'], 2);
		case 'MultiPolygon':
			return leaflet_map_is_position_list($geometry['coordinates'], 3);
		default:
			return false;
	}
}
