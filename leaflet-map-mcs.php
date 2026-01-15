<?php
/**
 * Plugin Name: Leaflet Map by MCS
 * Description: Carte Leaflet avec gestion de lieux personnalisés et filtres par catégories.
 * Version: 1.0.3
 * Author: Macsim - Maxime Lerouge
 */

if (!defined('ABSPATH')) {
	exit;
}

define('LEAFLET_MAP_PATH', plugin_dir_path(__FILE__));
define('LEAFLET_MAP_URL', plugin_dir_url(__FILE__));

require_once LEAFLET_MAP_PATH . 'includes/helpers.php';
require_once LEAFLET_MAP_PATH . 'includes/post-types.php';
require_once LEAFLET_MAP_PATH . 'includes/metabox-place.php';
require_once LEAFLET_MAP_PATH . 'includes/term-data.php';
require_once LEAFLET_MAP_PATH . 'includes/enqueue.php';
require_once LEAFLET_MAP_PATH . 'includes/data.php';
require_once LEAFLET_MAP_PATH . 'includes/shortcode.php';
require_once LEAFLET_MAP_PATH . 'includes/admin.php';

register_activation_hook(__FILE__, function () {
	require_once LEAFLET_MAP_PATH . 'includes/post-types.php';
	flush_rewrite_rules();
});

register_deactivation_hook(__FILE__, function () {
	flush_rewrite_rules();
});
