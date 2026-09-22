const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { JSDOM } = require("jsdom");

test("public results render bracket data as text without organizer controls or HTML injection", async t => {
    const dom = new JSDOM(`<!doctype html><h1 id="page-title"></h1><main id="content"></main>`, {
        url: "http://localhost/public.html?t=open-cup",
        runScripts: "outside-only"
    });
    t.after(() => dom.window.close());
    dom.window.NTUCUPCloud = {
        getPublicPublication: async () => ({
            name: "Open <img src=x onerror=alert(1)>",
            updated_at: "2026-09-22T00:00:00Z",
            data: {
                tournament: JSON.stringify({ open: { id: "open", name: "Open Cup", type: "elimination", matchIds: [1], roundMatchIds: [[1]] } }),
                matches: JSON.stringify([{ id: 1, group: "Final", teamAID: "A<script>", teamBID: "B", set1: [25, 20], set2: [25, 18], set3: [0, 0], winner: "A<script>", status: true }])
            }
        })
    };
    dom.window.eval(fs.readFileSync("src/utility/publicView.js", "utf8"));
    await new Promise(resolve => dom.window.setTimeout(resolve, 0));
    const document = dom.window.document;
    assert.equal(document.getElementById("page-title").textContent, "Open <img src=x onerror=alert(1)>");
    assert.match(document.querySelector(".match-teams").textContent, /A<script>/);
    assert.equal(document.querySelectorAll("script, img, input, button").length, 0);
    assert.equal(document.querySelectorAll(".bracket-round").length, 1);
    assert.match(document.querySelector(".match-score").textContent, /25–20 · 25–18/);
});
