<?php

add_action('admin_menu', function () {

	add_menu_page(
		'Leaflet Map',
		'Leaflet Map',
		'manage_options',
		'leaflet-map-settings',
		'leaflet_map_render_page',
		'dashicons-location-alt',
		80
	);
});


function leaflet_map_render_page() {
	?>
	<div class="wrap">
		<h1>Carte Leaflet</h1>
		<form method="post" action="options.php">
			<?php
			settings_fields('leaflet_map');
			do_settings_sections('leaflet-map-settings');
			submit_button();
			?>
		</form>
	</div>
	<?php
}
add_action('admin_init', function () {

	register_setting('leaflet_map', 'leaflet_map_settings');

	add_settings_section(
		'leaflet_map_main',
		'Réglages de la carte',
		null,
		'leaflet-map-settings'
	);

	add_settings_field(
		'prefix',
		'Préfixe des champs',
		function () {
			$options = leaflet_map_settings();
			echo '<input type="text" name="leaflet_map_settings[prefix]" value="' .
				esc_attr($options['prefix'] ?? 'leaflet') . '">';
		},
		'leaflet-map-settings',
		'leaflet_map_main'
	);
	add_settings_field(
		'post_type',
		'Type de contenu',
		function () {
			$options = leaflet_map_settings();
			echo '<input type="text" name="leaflet_map_settings[post_type]" value="' .
				esc_attr($options['post_type'] ?? 'place') . '">';
		},
		'leaflet-map-settings',
		'leaflet_map_main'
	);
	add_settings_field(
		'taxonomy',
		'Taxonomie',
		function () {
			$options = leaflet_map_settings();
			echo '<input type="text" name="leaflet_map_settings[taxonomy]" value="' .
				esc_attr($options['taxonomy'] ?? 'cat_place') . '">';
		},
		'leaflet-map-settings',
		'leaflet_map_main'
	);

});
