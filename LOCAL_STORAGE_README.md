# LocalStorage Reference

This document tracks the localStorage keys used by the NTUVBCUP app.

Reference sample: `/Users/andrew_is_alive/Desktop/ntucup/LocalStorageBackup/ntu-cup-backup.json`.
That file is treated as data only. All localStorage values are stored as strings in the browser; many values below are JSON strings that the app parses with `JSON.parse`.

## Day Numbers

Availability arrays use weekday numbers:

| Number | Day |
| --- | --- |
| `1` | Monday |
| `2` | Tuesday |
| `3` | Wednesday |
| `4` | Thursday |
| `5` | Friday |

## Core Keys

| Key | Parsed Shape | Purpose |
| --- | --- | --- |
| `matches` | `Match[]` | All generated games, scores, bracket links, date assignments, officials, lock state, and availability per match. |
| `teams` | `{ [teamID]: Team }` | NTU Cup team profiles, preliminary grouping/ranking data, game IDs, availability, and display names. |
| `newbieTeams` | `{ [teamID]: NewbieTeam }` | Newbie Cup team profiles, games, availability, and optional night availability. |
| `teamData` | `{ [inputKey]: string }` | Raw textarea/grouping input from team setup pages. Values preserve newline-separated groups. |
| `brackets` | `{ [bracketName]: Bracket }` | Bracket metadata used by the visual bracket page and finals generation. |
| `officialStats` | `{ [officialName]: OfficialStats }` | Official assignment counts, availability, and payment adjustment history. |
| `gameIDCounter` | `number` | Last generated match ID. Incremented before creating a new game. |
| `customTeams` | `{ [teamID]: CustomTeam }` | General-purpose teams for custom tournaments. Separate from NTU Cup and Newbie Cup teams. |
| `customMatches` | `CustomMatch[]` | Legacy custom match storage. Current custom tournament games are appended to `matches`. |
| `customTournaments` | `{ [tournamentID]: CustomTournament }` | Saved custom tournament metadata and match ID groupings. |
| `customGameIDCounter` | `number` | Legacy custom match ID counter. Current custom tournament games use `gameIDCounter`. |

## State and Control Keys

| Key | Parsed Shape | Purpose |
| --- | --- | --- |
| `gamesStarted` | `boolean` string | Marks whether the main NTU Cup has started. Used to warn/reset when editing groups. |
| `newbieStarted` | `boolean` string | Marks whether the Newbie Cup has started. |
| `payPerMatch` | `number` string | Official payment rate per assigned match. Defaults to `250` in code when missing. |
| `initialized` | `string` | Backup/sample contains an initialization marker like `2025-09-17-16`. Used as app/session metadata if present. |
| `isTier1FirstClick` | `boolean` string | Prevents regenerating Tier 1 finals on the first-click flow without confirmation. |
| `isTier2FirstClick` | `boolean` string | Prevents regenerating Tier 2 finals on the first-click flow without confirmation. |
| `isTier3FirstClick` | `boolean` string | Prevents regenerating Tier 3 finals on the first-click flow without confirmation. |
| `isTier4FirstClick` | `boolean` string | Prevents regenerating Tier 4 finals on the first-click flow without confirmation. |
| `Tier3 5-8 matches FirstClick` | `boolean` string | Prevents accidental repeat generation of Tier 3 5-8 loser/ranking matches. |
| `Tier3 9-12 matches FirstClick` | `boolean` string | Prevents accidental repeat generation of Tier 3 9-12 loser/ranking matches. |

Additional first-click keys are created dynamically by `saveFirstClick(firstClickKey, state)`, for example `Tier1 5-8 matches FirstClick`, `Tier2 5-8 matches FirstClick`, or `Tier2 9-12 matches FirstClick`.

## Object Schemas

### `Match`

Stored inside `matches`.

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `number` | Unique match/game ID. |
| `teamAID` | `string \| null` | Team ID for side A. Can be null for unfilled bracket slots. |
| `teamBID` | `string \| null` | Team ID for side B. Can be null for unfilled bracket slots. |
| `set1` | `[number, number]` | Set 1 scores. |
| `set2` | `[number, number]` | Set 2 scores. |
| `set3` | `[number, number]` | Set 3 scores. |
| `winner` | `string \| null` | Winning team ID after enough valid set scores exist. |
| `loser` | `string \| null` | Losing team ID for loser/ranking bracket propagation. |
| `status` | `boolean` | Whether the match is finished. |
| `nextMatch` | `number \| null` | Match ID that receives the winner. |
| `loserNextMatch` | `number` | Match ID that receives the loser, when applicable. |
| `preliminary` | `boolean \| null \| string` | Whether the match belongs to preliminary play. Some generated/special matches may store null/string legacy values. |
| `group` | `string \| null` | Group or bracket label, such as `Tier1-A`, `NewbieCup-Round1`, or finals bracket names. |
| `availableDays` | `number[]` | Intersection of both teams' available weekdays. |
| `official` | `string` | Assigned official name, or empty string. |
| `date` | `string \| null` | Scheduled date in `YYYY-MM-DD`, or null/empty when unscheduled. |
| `locked` | `boolean` | Prevents drag/delete changes in scheduling UI. |
| `newbie` | `boolean \| number` | Indicates Newbie Cup match. Sample data includes legacy numeric values. |

### `Team`

Stored inside `teams`.

| Field | Type | Notes |
| --- | --- | --- |
| `teamID` | `string` | Stable team key and display shorthand. |
| `games` | `number[]` | Match IDs involving this team. |
| `preliminaryScore` | `number` | Calculated ranking score for preliminary standings. |
| `preliminaryGroup` | `string` | Group label, such as `Tier1-A`. |
| `availableDays` | `number[]` | Weekdays this team can play. |
| `teamName` | `string` | Longer display/team name used in announcements. |

### `CustomTeam`

Stored inside `customTeams`.

| Field | Type | Notes |
| --- | --- | --- |
| `teamID` | `string` | Custom team key. |
| `games` | `number[]` | Custom match IDs involving this team. |
| `tags` | `string[]` | General-purpose labels used for filtering and tournament creation. The custom team form splits tags on spaces, commas, or newlines. |
| `availableDays` | `number[]` | Weekdays this team can play. |
| `teamName` | `string` | Longer display/team name. Defaults to `teamID`. |

### `CustomMatch`

Stored inside `matches` for current custom tournament builds. Older backups may still contain this shape inside legacy `customMatches`.

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `number` | Unique custom match ID. |
| `teamAID` | `string \| null` | Team ID for side A. Later bracket rounds start as null. |
| `teamBID` | `string \| null` | Team ID for side B. Later bracket rounds start as null. |
| `set1`, `set2`, `set3` | `[number, number]` | Scores. |
| `winner` | `string \| null` | Winning team ID when scores are later entered. |
| `loser` | `string \| null` | Losing team ID when scores are later entered. |
| `status` | `boolean` | Whether the match is finished. |
| `nextMatch` | `number \| null` | Next custom match that receives the winner for elimination brackets. |
| `loserNextMatch` | `number \| null` | Placement match that receives the loser near the end of elimination brackets. |
| `preliminary` | `boolean` | Always false for custom matches saved to the shared match list. |
| `newbie` | `boolean` | Always false for custom matches saved to the shared match list. |
| `tournamentID` | `string` | Parent custom tournament ID. |
| `group` | `string` | Custom group label, such as `Fall Open-Round1` or `Fall Open-Robin1`. |
| `round` | `number \| null` | Round number. |
| `availableDays` | `number[]` | Intersection of both teams' available weekdays. |
| `official` | `string` | Reserved for future official assignment. |
| `date` | `string \| null` | Reserved for future scheduling. |
| `locked` | `boolean` | Reserved for future locking. |
| `custom` | `boolean` | Always true for custom matches. |

### `CustomTournament`

Stored inside `customTournaments`.

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `string` | Slug-like tournament ID derived from the tournament name. |
| `name` | `string` | User-entered tournament name. |
| `type` | `"elimination" \| "robin"` | Tournament generation mode. |
| `matchIds` | `number[]` | Shared `matches` IDs created for this tournament. |
| `roundMatchIds` | `number[][]` | Present for elimination brackets. Custom match IDs grouped by round. |
| `teamIds` | `string[]` | Present for robin tournaments. Teams included in the robin round. |
| `size` | `number` | Present for elimination brackets. Bracket size, always a power of two. |
| `rounds` | `number` | Present for elimination brackets. Number of bracket rounds. |
| `teamCount` | `number` | Present for robin tournaments. Required number of teams; can be any integer of at least 2. |
| `repeatCount` | `number` | Present for robin tournaments. Number of complete robin cycles. |
| `createdAt` | `string` | ISO timestamp when saved. |

### `NewbieTeam`

Stored inside `newbieTeams`.

| Field | Type | Notes |
| --- | --- | --- |
| `teamID` | `string` | Newbie team key. |
| `teamName` | `string \| null` | Optional longer display/team name. |
| `games` | `number[]` | Match IDs involving this team. |
| `preliminaryScore` | `number` | Usually `0` for Newbie Cup data. |
| `preliminaryGroup` | `string` | Usually `Tier5` in the sample backup. |
| `availableDays` | `number[]` | Weekdays this team can play. |
| `availableNights` | `number[] \| null` | Optional night availability. Sample backup uses null. |

### `OfficialStats`

Stored inside `officialStats`.

| Field | Type | Notes |
| --- | --- | --- |
| `count` | `number` | Number of matches assigned to this official. Recalculated from `matches` when saving matches. |
| `availableDays` | `number[]` | Weekdays this official is available. |
| `adjustment` | `number` | Legacy single adjustment value. |
| `adjustmentHistory` | `Adjustment[]` | Current payment adjustment history. |

### `Adjustment`

Stored inside `officialStats[officialName].adjustmentHistory`.

| Field | Type | Notes |
| --- | --- | --- |
| `amount` | `number` | Positive bonus or negative deduction/cashout. |
| `note` | `string` | Reason for the adjustment. |
| `date` | `string` | Locale-formatted timestamp/date. |

### `Bracket`

Stored inside `brackets`.

| Field | Type | Notes |
| --- | --- | --- |
| `name` | `string` | Bracket name, such as `NewbieCup`, `Tier3Finals`, or `Tier3Relegation`. |
| `rounds` | `number` | Number of rounds in the bracket. |
| `matchIds` | `number[]` | Flat list of all match IDs in the bracket. |
| `roundMatchIds` | `number[][]` | Match IDs grouped by bracket round. |

## `teamData` Keys

`teamData` stores raw setup input as strings. Each value is typically newline-separated team IDs, with blank lines separating groups.

Observed keys:

| Key | Purpose |
| --- | --- |
| `Tier1-input` | Raw Tier 1 team grouping input. |
| `Tier2-input` | Raw Tier 2 team grouping input. |
| `Tier3-input` | Raw Tier 3 team grouping input. |
| `Tier4-input` | Raw Tier 4 team grouping input. |
| `Tier5-input` | Used by Newbie Cup setup when present. |

## Initialization Defaults in Code

When missing, helpers initialize or default these keys:

| Helper | Key | Default |
| --- | --- | --- |
| `fetchMatches()` | `matches` | `[]` |
| `fetchTeams()` | `teams` | `{}` |
| `fetchNewbieTeams()` | `newbieTeams` | `{}` |
| `fetchTeamData()` | `teamData` | `{}` |
| `fetchBrackets()` | `brackets` | `{}` |
| `fetchOfficialStats()` | `officialStats` | `{}` |
| `fetchGamesStarted()` | `gamesStarted` | `false` |
| `fetchNewbieStarted()` | `newbieStarted` | `false` |
| `fetchGameIDCounter()` | `gameIDCounter` | `0` |
| `fetchFirstClick(key)` | dynamic first-click key | `false` when absent |
| `fetchCustomTeams()` | `customTeams` | `{}` |
| `fetchCustomMatches()` | `customMatches` | `[]`; legacy only for older custom tournament data |
| `fetchCustomTournaments()` | `customTournaments` | `{}` |
| `fetchCustomGameIDCounter()` | `customGameIDCounter` | `0`; legacy only |

## Backup and Restore Notes

The main page exports/imports localStorage by copying every key as a string. When editing backup files manually, preserve that structure:

```json
{
  "matches": "[{\"id\":1,...}]",
  "teams": "{\"TeamID\":{\"teamID\":\"TeamID\",...}}",
  "gamesStarted": "true"
}
```

Do not store parsed arrays/objects directly in the backup file unless the restore code is changed to handle non-string values.
