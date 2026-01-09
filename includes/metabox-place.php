<?php

add_action('add_meta_boxes', function () {
	add_meta_box(
		'leaflet_place_coords',
		'Coordonnées GPS',
		'leaflet_render_place_metabox',
		leaflet_map_post_type()
	);
});

function leaflet_render_place_metabox($post) {

	wp_nonce_field(leaflet_map_meta_key('place_meta'), leaflet_map_meta_key('place_nonce'));

    $prefix = leaflet_map_prefix();

    $lat     = get_post_meta($post->ID, leaflet_map_meta_key("latitude"), true);
    $lng     = get_post_meta($post->ID, leaflet_map_meta_key("longitude"), true);
    $geo = get_post_meta($post->ID, leaflet_map_meta_key("geojson"), true);
    $line  = get_post_meta($post->ID, leaflet_map_meta_key("line_weight"), true) ?: 5;

	?>

	<p>
		<label>Latitude</label><br>
		<input type="number" step="0.000001" name="latitude" value="<?= esc_attr($lat) ?>">
	</p>

	<p>
		<label>Longitude</label><br>
		<input type="number" step="0.000001" name="longitude" value="<?= esc_attr($lng) ?>">
	</p>

	<p>
		<label>GeoJSON</label><br>
		<textarea name="geojson" rows="5" style="width:100%">
        <?= esc_textarea($geo) ?>
        </textarea>
	</p>

	<p>
		<label>Largeur ligne</label><br>
		<input type="number" min="2" max="10" name="line_weight" value="<?= esc_attr($line) ?>">
	</p>
<?php
}

add_action('save_post_' . leaflet_map_post_type(), function ($post_id) {

    $prefix = leaflet_map_prefix();

	if (!isset($_POST[leaflet_map_meta_key('place_nonce')]) ||
	    !wp_verify_nonce($_POST[leaflet_map_meta_key('place_nonce')], leaflet_map_meta_key('place_meta'))) {
		return;
	}

	foreach (['latitude', 'longitude', 'line_weight'] as $field) {
		if (isset($_POST[$field])) {
			update_post_meta($post_id, leaflet_map_meta_key($field), sanitize_text_field($_POST[$field]));
		}
	}

    if (isset($_POST['geojson'])) {
            $geo = wp_unslash($_POST['geojson']);
			update_post_meta($post_id, leaflet_map_meta_key('geojson'), $geo);
    }
});
