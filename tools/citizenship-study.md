# Citizenship study app

The Eleventy page is `src/pages/citizenship-test.liquid`. Its styles are exclusively in `src/assets/css/pages/citizenship-test.css`; `citizenship-test.js` controls the UI and `citizenship-study.js` contains dependency-free study rules.

## Content provenance

- 2008 bank: https://www.uscis.gov/sites/default/files/document/questions-and-answers/OoC_100_Questions_2008_Civics_Test_V1.pdf (rev. 08/21).
- 2025 bank: https://www.uscis.gov/sites/default/files/document/questions-and-answers/2025-Civics-Test-128-Questions-and-Answers.pdf (M-1778, 09/25).
- Version eligibility and test rules: https://www.uscis.gov/citizenship/find-study-materials-and-resources/study-for-the-test
- National answers cross-checked with USCIS: https://www.uscis.gov/citizenship/testupdates
- Senators: https://www.senate.gov/general/contact_information/senators_cfm.xml
- Governors: https://www.nga.org/governors/ (individual source links stored per governor).
- Representatives: https://clerk.house.gov/xml/lists/MemberData.xml (published September 2, 2026; checked September 10, 2026).
- District lookup: https://www.house.gov/representatives/find-your-representative

The 2025 PDF was extracted with `pdftotext -layout`, retaining numbered questions, bullet answers and asterisks; page headers, footers, wrapping and the BIA bibliography line were omitted. Existing 2008 PDF footer/control-character contamination was removed. Question/answer wording is retained. Hints are original study aids, explicitly distinguished from USCIS answers. The `required` field encodes the number of items requested, not the number of alternative bullet answers. The 2008 Chief Justice question is now correctly treated as variable.

## Refreshing officeholders

`src/assets/data/civics-officials.json` is a checked snapshot dated September 10, 2026, not a live API. It includes 100 senators, 55 governors (states and territories), and the six national answers needed across both banks. Check all source pages when refreshing it. Change `verifiedOn` only after every officeholder group has been checked; also update the JSON cache token in the UI fetch URLs. `civics-representatives.json` contains the Clerk’s full roster of 441 seats: 435 voting districts and six delegates/resident commissioners, including two vacant seats. It has its own `verifiedOn` and `publishedOn` dates. Refresh it from the member XML using `statedistrict`, `member-info/official-name`, and `member-info/district`; preserve vacant rows with an empty name and `vacant: true`. Verify that all 56 places and all 435 voting districts remain covered. Never infer a district from a state or ZIP code alone. States with one district and territories prefill automatically; other states require a district selection. User overrides are clearly marked and remain local.

## Study behavior

- Each answer is saved immediately. An unfinished set resumes after reloading.
- Progress shows all answered questions in the current test/location/special-set scope, most recent first, with total correct/missed attempts, assisted-correct counts, latest result and last-practiced time. “Keep missing” shows questions missed at least twice, ordered by total misses; learned questions remain in this history. A practice action reviews these questions in sets of up to ten.
- Existing totals and timestamps appear immediately. Older records without a latest-result field remain unknown until the next answer; no past outcomes are inferred. Undo restores both totals and the prior latest result.
- A wrong or hinted answer enters review. Two consecutive correct answers without hints clear it; historical mistakes remain available.
- “Questions I got wrong” includes only unresolved mistakes, while “Missed + hinted questions” also includes assisted answers.
- Mixed practice reserves room for unseen cards to prevent hard questions from starving the rest of the bank.
- A practice interview uses 6/10 for 2008 and both 65/20 sets, or 12/20 for standard 2025. It ends at the passing threshold or when passing is no longer possible. It is explicitly self-assessed, without hints. An unknown answer counts as incorrect.
- Study skips do not change a question's score. Undo restores the previous record.
- Progress keys distinguish both test version and location for local questions, plus congressional district for representative questions. District selections are remembered per state. Changing districts does not transfer a saved custom representative or learning history to the new district. Changing a saved official answer resets its learning streak in both versions but preserves its correct/missed totals and latest-result history.
- Legacy `coffeeandfun.civics2008.v1` data is migrated to `coffeeandfun.civics.v2` without deleting the legacy key. Reset explicitly removes it to prevent reimport.
- Storage failures preserve an in-memory session and show a warning. No cross-device sync is claimed.
- The print view defaults to quick facts and personal answers. The optional question-bank checkbox includes the search/filter selection and hints.

## Validation

Run `node --test tools/citizenship-test.mjs` and `npm run build`. The tests cover data integrity, special sets, scoring, review behavior, coverage, migration, state/territory resolution, district coverage, single-seat prefilling, district-specific overrides, and vacancy handling. Separate checks verify template IDs, control labels, ARIA references and JSON-LD. Browser/device and screen-reader testing are not covered by these checks.

Preview with `node tools/serve-docs.mjs`, then open `/citizenship-test/` on the displayed local URL.
