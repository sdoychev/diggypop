# DiggyPop Advisor

Usage analytics and play recommendation portal for the DiggyPop platform.

## Quick Start

```bash
npm install
npm run dev
```

Opens at `http://localhost:3000`.

## Architecture

Single-page React app (Vite). Everything lives in `src/App.jsx`:

- **Data layer** — Hardcoded arrays (`RAW_CHARADES`, `RAW_MOJIMATCH`, `RAW_SOUND`) parsed from Supabase CSV exports. These should be replaced with live Supabase queries.
- **Profile builder** — `buildProfiles()` merges data from all three game types into per-user profiles keyed by `uuid`.
- **Recommendation engine** — `getRecs(profile)` runs 10 rule-based checks against computed metrics (accuracy, frequency, completion rate, deck variety, etc.) and returns prioritized recommendations.
- **UI** — Two tabs: Overview (aggregate stats, game distribution, deck popularity, attention list) and Users (searchable sidebar + detail panel with stats, deck chips, MojiMatch history, recommendations).

## Recommendation Algorithm

See `DiggyPop_Recommendation_Algorithm.pdf` for full documentation of all 10 rules, thresholds, computed metrics, and known limitations.

## Next Steps

- [ ] Connect to Supabase for live data instead of hardcoded arrays
- [ ] Add date range filtering
- [ ] Add export/print for individual user reports
- [ ] Tune thresholds with clinical input
- [ ] Add Sound Challenge rules when more data is available
