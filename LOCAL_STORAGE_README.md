# LocalStorage Reference

The app has one team pool and one tournament collection. All localStorage values are strings.

| Key | JSON shape | Purpose |
| --- | --- | --- |
| `teams` | Object keyed by team ID | Team profiles: `teamID`, `teamName`, `tags`, `availableDays`, `games`. |
| `tournament` | Object keyed by tournament ID | Tournament name, type, match IDs, round groupings, creation timestamp, and format settings. The storage key is singular even though it holds multiple tournaments. |
| `matches` | Array | Scores, participants, winner/loser links, tournament ID, group, round, date, official, lock state, and availability. |
| `gameIDCounter` | Number | Shared match ID counter. |
| `officialStats` | Object keyed by official name | Assignment counts, availability, and payment adjustment history. |
| `payPerMatch` | Numeric string | Payment per match; defaults to 250. |

Weekday availability uses 1 (Monday) through 5 (Friday). An empty array means no available days; missing availability means all weekdays.

Elimination tournaments store `size`, `rounds`, `matchIds`, and `roundMatchIds`. Round-robin tournaments store `teamCount`, `repeatCount`, `teamIds`, and `matchIds`. Both store `id`, `name`, `type`, and `createdAt`.

The `nextMatchSlot` and `loserNextMatchSlot` fields preserve the destination side when a match is deleted or restored. The `nextMatch` link advances the winner; `loserNextMatch` advances the loser to a placement game. Saving scores recalculates linked participants, team game lists, and official counts.

Backups contain the keys above with their string values. Upload replaces those keys. Older backups and existing browser storage are translated by the compatibility boundary in `dataStorage.js`: former prefixed team and tournament records become `teams` and `tournament`; only matches belonging to those tournaments are retained. The retired cup records are excluded. New backups contain no tier flags or prefixed keys.
