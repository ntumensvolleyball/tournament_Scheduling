const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');

function page(t) {
    const html = fs.readFileSync('src/pages/tournament.html', 'utf8').replace(
        /<script[^>]*src="..\/utility\/([^"]+)"[^>]*><\/script>/g,
        (_, file) => `<script>${fs.readFileSync(`src/utility/${file}`, 'utf8')}</script>`);
    const dom = new JSDOM(html, {
        url: 'http://localhost/src/pages/tournament.html', runScripts: 'dangerously',
        beforeParse(window) {
            window.localStorage.setItem('teams', JSON.stringify(Object.fromEntries(
                ['A', 'B', 'C', 'D'].map(id => [id, { teamID: id, tags: [], availableDays: [1, 2] }]))));
        }
    });
    t.after(() => dom.window.close());
    const w = dom.window, document = w.document;
    return {
        document,
        set(id, value) { const input = document.getElementById(id); input.value = value; input.dispatchEvent(new w.Event('change')); },
        drop(id, selector) { const event = new w.Event('drop', { bubbles: true }); event.dataTransfer = { getData: () => id }; document.querySelector(selector).dispatchEvent(event); },
        save() { document.getElementById('save-game-creation').click(); },
        stored(key) { return JSON.parse(w.localStorage.getItem(key)); },
        status() { return document.getElementById('builder-status').textContent; }
    };
}
for (const format of ['elimination', 'robin']) {
    test(`Save button persists ${format} matches and tournament metadata`, t => {
        const p = page(t);
        p.set('tournament-format', format);
        p.set('bracket-size', '4');
        p.set('tournament-name', 'Open');
        ['A', 'B', 'C', 'D'].forEach((id, i) => p.drop(id,
            format === 'robin' ? '[data-robin-dropzone]' : `[data-slot-index="${i}"]`));
        p.save();
        assert.equal(p.stored('matches').length, format === 'robin' ? 6 : 4);
        assert.equal(p.stored('tournament').open.type, format);
        assert.match(p.status(), /Saved tournament "Open"/);
        assert.equal(p.stored('brackets'), null);
    });
}
test('Save explains missing name and missing teams inline without writing a tournament', t => {
    const p = page(t);
    p.save();
    assert.match(p.status(), /Not saved: enter a tournament name/);
    p.set('tournament-name', 'Open');
    p.save();
    assert.match(p.status(), /Not saved: Fill every first-round bracket slot/);
    assert.equal(p.stored('tournament'), null);
    p.drop('A', '[data-slot-index="0"]');
    p.drop('B', '[data-slot-index="1"]');
    p.save();
    assert.equal(p.stored('matches').length, 1);
    assert.ok(p.stored('tournament').open);
});
