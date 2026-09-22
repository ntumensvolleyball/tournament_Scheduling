(function () {
    "use strict";
    const content = document.getElementById("content");
    function el(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }
    function unpack(snapshot, key, fallback) {
        const value = snapshot?.[key];
        if (typeof value === "string") { try { return JSON.parse(value); } catch { return fallback; } }
        return value ?? fallback;
    }
    function score(match) {
        return [match.set1, match.set2, match.set3]
            .filter(set => Array.isArray(set) && (Number(set[0]) || Number(set[1])))
            .map(set => `${Number(set[0]) || 0}–${Number(set[1]) || 0}`)
            .join(" · ") || "Scheduled";
    }
    function matchCard(match) {
        const card = el("article", "match-card");
        const heading = el("div", "match-heading");
        heading.append(el("strong", "", match.group || `Match ${match.id}`), el("span", "match-date", match.date || "Date TBA"));
        const teams = el("div", "match-teams");
        const a = el("span", match.winner === match.teamAID ? "winner" : "", match.teamAID || "TBA");
        const b = el("span", match.winner === match.teamBID ? "winner" : "", match.teamBID || "TBA");
        teams.append(a, el("span", "versus", "vs"), b);
        card.append(heading, teams, el("div", "match-score", score(match)));
        if (match.official) card.append(el("small", "muted", `Official: ${match.official}`));
        return card;
    }
    function renderTournament(record) {
        const snapshot = record.data || {};
        const matches = unpack(snapshot, "matches", []);
        const tournaments = unpack(snapshot, "tournament", {});
        document.getElementById("page-title").textContent = record.name;
        content.replaceChildren();
        const summary = el("section", "panel public-summary");
        summary.append(el("p", "muted", `Updated ${new Date(record.updated_at).toLocaleString()}`));
        const stats = el("div", "stats");
        stats.append(el("div", "stat", `${Object.keys(tournaments).length} tournaments`), el("div", "stat", `${matches.length} matches`), el("div", "stat", `${matches.filter(match => match.status).length} finished`));
        summary.append(stats); content.append(summary);
        Object.values(tournaments).forEach(tournament => {
            const section = el("section", "panel tournament-section");
            section.append(el("h2", "", tournament.name || tournament.id));
            const byId = new Map(matches.map(match => [String(match.id), match]));
            if (tournament.type === "elimination" && Array.isArray(tournament.roundMatchIds)) {
                const bracket = el("div", "bracket-scroll");
                tournament.roundMatchIds.forEach((ids, roundIndex) => {
                    const round = el("div", "bracket-round");
                    const isFinalRound = roundIndex === tournament.roundMatchIds.length - 1;
                    round.append(el("h3", "", isFinalRound ? "Finals" : `Round ${roundIndex + 1}`));
                    const games = el("div", "bracket-games");
                    ids.map(id => byId.get(String(id))).filter(Boolean).forEach(match => games.append(matchCard(match)));
                    round.append(games); bracket.append(round);
                });
                section.append(bracket);
            } else {
                const grid = el("div", "match-grid");
                (tournament.matchIds || []).map(id => byId.get(String(id))).filter(Boolean).forEach(match => grid.append(matchCard(match)));
                if (!grid.children.length) grid.append(el("p", "muted", "No matches have been created."));
                section.append(grid);
            }
            content.append(section);
        });
        if (!Object.keys(tournaments).length) content.append(el("section", "panel", "No tournament data has been published."));
    }
    async function renderList() {
        const items = await NTUCUPCloud.listPublications();
        content.replaceChildren();
        if (!items.length) { content.append(el("section", "panel", "No public tournaments yet.")); return; }
        items.forEach(item => {
            const card = el("a", "panel publication-card");
            card.href = `public.html?t=${encodeURIComponent(item.slug)}`;
            card.append(el("h2", "", item.name), el("p", "muted", `Updated ${new Date(item.updated_at).toLocaleString()}`));
            content.append(card);
        });
    }
    (async () => {
        try {
            const slug = new URLSearchParams(location.search).get("t");
            if (slug) renderTournament(await NTUCUPCloud.getPublicPublication(slug));
            else await renderList();
        } catch (error) {
            content.replaceChildren(el("section", "panel error", error.message));
        }
    })();
})();
