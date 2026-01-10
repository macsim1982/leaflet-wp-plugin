<?php

/**
 * Render the Leaflet map shortcode.
 *
 * Generates the HTML structure for a map instance.
 * Supports multiple maps on the same page.
 *
 * Usage: [leaflet_map] or [leaflet_map id="my-custom-map"]
 *
 * @param array $atts Shortcode attributes
 * @return string HTML markup for the map
 */
function leaflet_map_shortcode($atts = []) {
	$atts = shortcode_atts(
		[
			'id' => 'leaflet-map-' . uniqid(),
			'class' => '',
		],
		$atts,
		'leaflet_map'
	);

	$map_id = sanitize_html_class($atts['id']);
	$custom_class = sanitize_html_class($atts['class']);

	// Generate unique IDs for nested elements
	$container_id = $map_id . '-container';
	$filters_id = $map_id . '-filters';

	$classes = 'leaflet-map-wrapper';
	if ($custom_class) {
		$classes .= ' ' . $custom_class;
	}

	ob_start();
	?>
	<div class="<?php echo esc_attr($classes); ?>" data-map-id="<?php echo esc_attr($map_id); ?>">
		<div id="<?php echo esc_attr($container_id); ?>" class="leaflet-map-container"></div>
		<div id="<?php echo esc_attr($filters_id); ?>" class="leaflet-map-filters"></div>
	</div>
	<?php

	return ob_get_clean();
}

add_shortcode('leaflet_map', 'leaflet_map_shortcode');
