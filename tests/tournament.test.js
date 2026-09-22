const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
function app(initial = {}) {
    const data = new Map(Object.entries(initial));
    const context = vm.createContext({ console, localStorage: {
        getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, String(value)),
        removeItem: key => data.delete(key), clear: () => data.clear(), key: i => [...data.keys()][i],
        get length() { return data.size; }
    }});
    for (const file of ['dataStorage.js', 'tournament.js']) vm.runInContext(fs.readFileSync(`src/utility/${file}`, 'utf8'), context);
    return { run: code => JSON.parse(JSON.stringify(vm.runInContext(code, context)) ?? 'null'), data };
}
function seeded() {
    const a = app();
    a.run(`saveTeams(Object.fromEntries(['A','B','C','D'].map(id => [id, createTeam(id,id,['open'],[1,2])])));`);
    return a;
}
test('elimination advances winners and losers, corrections invalidate downstream scores', () => {
    const a = seeded();
    a.run(`const stage = createEliminationStage('Open', 4); stage.slots = ['A','B','C','D']; saveBuiltTournament(buildEliminationTournament(stage));`);
    assert.equal(a.run('fetchMatches().length'), 4);
    a.run(`let games = fetchMatches(); games[0].set1 = games[0].set2 = [25,10]; games[1].set1 = games[1].set2 = [25,10]; saveMatches(games);`);
    assert.deepEqual(a.run('fetchMatches().slice(2).map(m => [m.teamAID,m.teamBID])'), [['A','C'],['B','D']]);
    a.run(`games = fetchMatches(); games[2].set1 = games[2].set2 = [25,10]; saveMatches(games);`);
    a.run(`games = fetchMatches(); games[0].set1 = games[0].set2 = [10,25]; saveMatches(games);`);
    assert.deepEqual(a.run('fetchMatches().slice(2).map(m => [m.teamAID,m.teamBID])'), [['B','C'],['A','D']]);
    assert.equal(a.run('fetchMatches()[2].winner'), null);
    assert.deepEqual(a.run('fetchTeams().A.games'), [1,4]);
    a.run(`games = fetchMatches(); games[0].set1 = games[0].set2 = [0,0]; saveMatches(games);`);
    assert.equal(a.run('fetchMatches()[3].teamAID'), null);
});
test('round robin repeats, unique IDs, singular storage key and duplicate protection', () => {
    const a = seeded();
    a.run(`const s = createRobinStage('League',3,2); s.teams=['A','B','C']; saveBuiltTournament(buildRobinTournament(s));`);
    assert.equal(a.run('fetchMatches().length'), 6);
    assert.ok(a.data.has('teams')); assert.ok(a.data.has('tournament'));
    assert.throws(() => a.run('saveBuiltTournament(buildRobinTournament(s))'), /already exists/);
    a.run(`s.name='Second'; saveBuiltTournament(buildRobinTournament(s));`);
    assert.equal(a.run('new Set(fetchMatches().map(m=>m.id)).size'),12);
});
test('availability preserves empty intersections and renaming updates metadata', () => {
    const a = seeded();
    a.run(`const s = createRobinStage('League',2,1); s.teams=['A','B']; saveBuiltTournament(buildRobinTournament(s));
        const teams=fetchTeams(); teams.B.availableDays=[3]; saveTeams(teams); saveMatches(fetchMatches());`);
    assert.deepEqual(a.run('fetchMatches()[0].availableDays'), []);
    a.run(`const t=fetchTeams(); t.Z={...t.A,teamID:'Z'}; delete t.A; saveTeams(t); renameTeamReferences('A','Z');`);
    assert.equal(a.run('fetchMatches()[0].teamAID'),'Z');
    assert.deepEqual(a.run('fetchTournaments().league.teamIds'),['Z','B']);
});
test('migration retains former builder data without mixing retired teams or matches', () => {
    const a = app({ teams: JSON.stringify({old:{teamID:'old'}}), customTeams: JSON.stringify({A:{teamID:'A'},B:{teamID:'B'}}),
        customTournaments: JSON.stringify({open:{id:'open',matchIds:[2]}}),
        matches: JSON.stringify([{id:1,teamAID:'old'}, {id:2,teamAID:'A',teamBID:'B',custom:true,newbie:false,preliminary:false,set1:[0,0],set2:[0,0],set3:[0,0]}]) });
    assert.deepEqual(a.run('Object.keys(fetchTeams())'),['A','B']);
    assert.deepEqual(a.run('fetchMatches().map(m=>m.id)'),[2]);
    assert.equal(a.data.has('customTeams'),false);
    assert.equal(a.run('"custom" in fetchMatches()[0]'),false);
    const backup=a.run('exportTournamentBackup()');
    a.run(`importTournamentBackup(${JSON.stringify(backup)})`);
    assert.deepEqual(a.run('exportTournamentBackup()'),backup);
    assert.throws(()=>a.run('importTournamentBackup({teams:"broken"})'));
    assert.deepEqual(a.run('exportTournamentBackup()'),backup);
});
test('all scripts parse and every local page asset/link resolves', () => {
    const files = [...fs.readdirSync('.').filter(file => file.endsWith('.html')), ...fs.readdirSync('src/pages').map(f=>'src/pages/'+f), ...fs.readdirSync('src/utility').map(f=>'src/utility/'+f)];
    for (const file of files) {
        if (!/\.(html|js)$/.test(file)) continue;
        const source=fs.readFileSync(file,'utf8');
        if(file.endsWith('.js')) new vm.Script(source,{filename:file});
        else {
            for(const match of source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) new vm.Script(match[1],{filename:file});
            for(const [, link] of source.matchAll(/(?:src|href)\s*=\s*['"]([^'"]+)['"]/g)) {
                if (/^(https?:|#|\$|data:)/.test(link)) continue;
                const localPath = link.split(/[?#]/, 1)[0];
                const resolvedPath = localPath.startsWith('/')
                    ? path.resolve('.', localPath.slice(1))
                    : path.resolve(path.dirname(file), localPath);
                assert.ok(fs.existsSync(resolvedPath), `${file}: ${link}`);
            }
        }
    }
});
test('deleting and restoring a semifinal preserves bracket sides across later saves', () => {
    const a = seeded();
    a.run(`const stage = createEliminationStage('Cup',4); stage.slots=['A','B','C','D']; saveBuiltTournament(buildEliminationTournament(stage));
        let games=fetchMatches(); games[0].set1=games[0].set2=[25,10]; games[1].set1=games[1].set2=[25,10]; saveMatches(games);
        const removed=fetchMatches()[0]; saveMatches(fetchMatches().slice(1)); saveMatches(fetchMatches());`);
    assert.deepEqual(a.run('fetchMatches().find(m=>m.id===3) && [fetchMatches().find(m=>m.id===3).teamAID,fetchMatches().find(m=>m.id===3).teamBID]'),[null,'C']);
    a.run('saveMatches([removed,...fetchMatches()]);');
    assert.deepEqual(a.run('fetchMatches().find(m=>m.id===3) && [fetchMatches().find(m=>m.id===3).teamAID,fetchMatches().find(m=>m.id===3).teamBID]'),['A','C']);
});
