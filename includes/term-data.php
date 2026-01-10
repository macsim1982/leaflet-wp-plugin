<?php

// Use the taxonomy hooks for adding/editing term form fields.
add_action(leaflet_map_taxonomy() . '_add_form_fields', 'mcs_add_term_color');
add_action(leaflet_map_taxonomy() . '_edit_form_fields', 'mcs_edit_term_color');

function mcs_add_term_color() {
	?>
	<div class="form-field">
		<label>Couleur</label>
		<input type="text" name="cat_place_color" class="mcs-color-field" value="#DDDDDD">
	</div>
	<?php
}

function mcs_edit_term_color($term) {
	$color = get_term_meta($term->term_id, leaflet_map_meta_key('cat_place_color'), true) ?: '#DDDDDD';
	?>
	<tr class="form-field">
		<th><label>Couleur</label></th>
		<td>
			<input type="text" name="cat_place_color" class="mcs-color-field" value="<?= esc_attr($color) ?>">
		</td>
	</tr>
	<?php
}

add_action('created_' . leaflet_map_taxonomy(), 'mcs_save_term_color');
add_action('edited_' . leaflet_map_taxonomy(), 'mcs_save_term_color');

function mcs_save_term_color($term_id) {
	if (isset($_POST['cat_place_color'])) {
		update_term_meta($term_id, leaflet_map_meta_key('cat_place_color'), sanitize_hex_color($_POST['cat_place_color']));
	}
}
