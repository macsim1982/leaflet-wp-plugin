const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const dataSrc = fs.readFileSync(path.join(root, 'includes/data.php'), 'utf8');
const mapInitSrc = fs.readFileSync(path.join(root, 'assets/js/map-init.js'), 'utf8');

/**
 * Same helper as map-init.js: union bounds from groups that have layers.
 */
function boundsFromGroups(groups) {
  let bounds = null;
  if (!Array.isArray(groups)) {
    return null;
  }

  for (const group of groups) {
    if (!group || typeof group.getLayers !== 'function') {
      continue;
    }

    const layers = group.getLayers();
    if (!layers || !layers.length || typeof group.getBounds !== 'function') {
      continue;
    }

    const next = group.getBounds();
    if (!next || typeof next.isValid !== 'function' || !next.isValid()) {
      continue;
    }

    bounds = bounds ? bounds.extend(next) : next;
  }

  return bounds;
}

function mockBounds(id) {
  return {
    id,
    isValid() {
      return true;
    },
    extend(other) {
      this.id = `${this.id}+${other.id}`;
      return this;
    },
  };
}

function mockGroup(id, layerCount) {
  return {
    getLayers() {
      return Array.from({ length: layerCount }, (_, i) => ({ id: `${id}-${i}` }));
    },
    getBounds() {
      return mockBounds(id);
    },
  };
}

test('WP places without a category are exported as term default', () => {
  assert.match(dataSrc, /\$term_slug\s*=\s*'default'/);
});

test('uncategorized and static features are pinned to staticGroup, not allGroup', () => {
  assert.match(
    mapInitSrc,
    /p\.term === 'default' \|\| p\.term === 'static'/
  );
  assert.match(mapInitSrc, /staticGroup\.addLayer\(layer\)/);
});

test('boundsFromGroups is empty when allGroup is empty — the old flyToBounds path', () => {
  const allGroup = mockGroup('all', 0);
  const staticGroup = mockGroup('static', 1);

  assert.equal(boundsFromGroups([allGroup]), null);
  assert.equal(boundsFromGroups([allGroup, staticGroup]).id, 'static');
});

test('boundsFromGroups unions categorized and uncategorized layers', () => {
  const allGroup = mockGroup('all', 2);
  const staticGroup = mockGroup('static', 1);

  assert.equal(boundsFromGroups([allGroup, staticGroup]).id, 'all+static');
});

test('empty or invalid groups are skipped instead of throwing', () => {
  assert.equal(boundsFromGroups(null), null);
  assert.equal(boundsFromGroups([]), null);
  assert.equal(boundsFromGroups([null, undefined, {}]), null);
  assert.equal(
    boundsFromGroups([
      {
        getLayers() {
          return [{}];
        },
        getBounds() {
          return { isValid() { return false; } };
        },
      },
    ]),
    null
  );
});

test('initial view and Tous fit both allGroup and staticGroup', () => {
  assert.match(mapInitSrc, /function boundsFromGroups\s*\(/);
  assert.match(mapInitSrc, /function flyToGroups\s*\(/);
  assert.match(
    mapInitSrc,
    /flyToGroups\(\s*map,\s*\[\s*map\._allGroup,\s*map\._staticGroup\s*\]\s*\)/
  );
  assert.match(
    mapInitSrc,
    /flyToGroups\(\s*map,\s*\[\s*allGroup,\s*staticGroup\s*\]\s*\)/
  );
});
