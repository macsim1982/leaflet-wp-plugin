/**
 * HTML / URL sanitizers for map popups and marker SVG.
 * Works as a classic browser script and as a CommonJS module for tests.
 */
(function (root, factory) {
	var api = factory();
	if (typeof module === 'object' && module.exports) {
		module.exports = api;
	} else {
		root.LeafletMapSafeHtml = api;
	}
})(typeof self !== 'undefined' ? self : this, function () {
	function escapeHtml(value) {
		return String(value == null ? '' : value)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	}

	function isSafeUrl(value) {
		if (value == null) {
			return false;
		}

		var str = String(value).trim();
		if (!str || str === 'no') {
			return false;
		}

		if (str.charAt(0) === '/' && str.charAt(1) !== '/') {
			return str.indexOf('\\') === -1 && str.indexOf('\n') === -1;
		}

		try {
			var url = new URL(str);
			return url.protocol === 'http:' || url.protocol === 'https:';
		} catch (err) {
			return false;
		}
	}

	function toSafeClass(value) {
		var cleaned = String(value == null ? '' : value).replace(/[^a-zA-Z0-9_-]/g, '');
		return cleaned.slice(0, 64);
	}

	function toSafeColor(value) {
		var str = String(value == null ? '' : value).trim();
		if (/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(str)) {
			return str;
		}
		if (/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(str)) {
			return '#' + str;
		}
		return '#333333';
	}

	return {
		escapeHtml: escapeHtml,
		isSafeUrl: isSafeUrl,
		toSafeClass: toSafeClass,
		toSafeColor: toSafeColor,
	};
});
