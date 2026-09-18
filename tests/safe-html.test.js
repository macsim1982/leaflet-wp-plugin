const test = require('node:test');
const assert = require('node:assert/strict');
const {
	escapeHtml,
	isSafeUrl,
	toSafeClass,
	toSafeColor,
} = require('../assets/js/safe-html.js');

function buildPopupHtml(item, category, safe) {
	const title = safe.escapeHtml(item.title);
	const excerpt = safe.escapeHtml(item.excerpt);
	const termClass = safe.toSafeClass(item.term);
	const catName = safe.escapeHtml(category.name);
	const catColor = safe.toSafeColor(category.color);
	const image = safe.isSafeUrl(item.image)
		? `<img class="leaflet-map-popup-image" src="${safe.escapeHtml(item.image)}" alt="${title}" />`
		: '';
	const link =
		item.link !== 'no' && safe.isSafeUrl(item.link)
			? `<a href="${safe.escapeHtml(item.link)}">Voir la fiche</a>`
			: '';

	return `
        <div class="leaflet-map-popup-category" style="--cat-rgb:${catColor}">
            <div class="leaflet-map-popup-category-name">${catName}</div>
            <div class="leaflet-map-popup ${termClass}">
                ${image}
                <div class="leaflet-map-popup-content">
                    <h3>${title}</h3>
                    <p>${excerpt}</p>
                    ${link}
                </div>
            </div>
        </div>
    `;
}

test('escapeHtml neutralizes tag and attribute breakouts', () => {
	assert.equal(
		escapeHtml('<img src=x onerror=alert(1)>'),
		'&lt;img src=x onerror=alert(1)&gt;'
	);
	assert.equal(
		escapeHtml('x" onerror="alert(1)'),
		'x&quot; onerror=&quot;alert(1)'
	);
	assert.equal(escapeHtml("O'Brien & Sons"), 'O&#39;Brien &amp; Sons');
});

test('isSafeUrl allows http(s) and site-relative paths only', () => {
	assert.equal(isSafeUrl('https://example.com/lieu/foo'), true);
	assert.equal(isSafeUrl('http://example.com/img.jpg'), true);
	assert.equal(isSafeUrl('/lieu/foo'), true);
	assert.equal(isSafeUrl('javascript:alert(1)'), false);
	assert.equal(isSafeUrl('data:text/html,<script>alert(1)</script>'), false);
	assert.equal(isSafeUrl('vbscript:msgbox(1)'), false);
	assert.equal(isSafeUrl('//evil.example/payload'), false);
	assert.equal(isSafeUrl('no'), false);
});

test('toSafeClass and toSafeColor reject markup injection', () => {
	assert.equal(toSafeClass('foo"><img src=x onerror=alert(1)>'), 'fooimgsrcxonerroralert1');
	assert.equal(toSafeColor('#ff00aa'), '#ff00aa');
	assert.equal(toSafeColor('red"></path><script>alert(1)</script>'), '#333333');
});

test('buildPopupHtml does not preserve injected markup from GeoJSON/title fields', () => {
	const html = buildPopupHtml(
		{
			title: '<img src=x onerror=alert(1)>',
			excerpt: '</p><script>alert(1)</script>',
			term: 'x"><img src=x onerror=alert(1)>',
			image: 'javascript:alert(1)',
			link: 'javascript:alert(document.cookie)',
		},
		{ name: '<b>xss</b>', color: '#00ff00" onload="alert(1)' },
		{ escapeHtml, isSafeUrl, toSafeClass, toSafeColor }
	);

	assert.equal(html.includes('<script>'), false);
	assert.equal(html.includes('<img src=x'), false);
	assert.equal(html.includes('javascript:'), false);
	assert.equal(html.includes('onload="alert'), false);
	assert.equal(html.includes('&lt;img src=x onerror=alert(1)&gt;'), true);
	assert.equal(html.includes('&lt;script&gt;'), true);
	assert.equal(html.includes('<a href='), false);
	assert.equal(html.includes('leaflet-map-popup-image'), false);
	assert.equal(html.includes('--cat-rgb:#333333'), true);
});
