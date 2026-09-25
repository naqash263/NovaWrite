# Automation tools: competitor analysis and QA (reviewed 2026-09-25)

Hub: `/resources/utility-tools` (category `developer`). Tools: Cron Expression Generator
(`cron-expression-generator`) and cURL to n8n Converter (`curl-to-n8n-converter`). Built from the growth audit,
section 5.1 (`docs/GROWTH_AUDIT_2026-09.md`, priorities 3 and 7).

Both tools run entirely in the browser (`processing: 'browser'`, no network calls). Competitor pages and
docs.n8n.io could not be fetched from the research environment (egress proxy), so competitor capabilities come
from search-result snippets listed under Sources. n8n behaviour was checked against n8n's own source and docs
repositories on GitHub (raw files were reachable) and is cited file by file below. Only facts found there are
claimed on the pages.

Content lives in `frontend/src/data/tools/utility-developer.ts`; logic in `frontend/src/utils/cron.ts` and
`frontend/src/utils/curlToN8n.ts`; tests in `frontend/e2e/tools/automation.spec.ts`.

## Verified n8n facts

| Fact | Where it is used | Source |
| --- | --- | --- |
| Schedule Trigger "Custom (Cron)" takes `rule.interval[].field = 'cronExpression'` plus `expression`; the field hint is `([Second]) [Minute] [Hour] [Day of Month] [Month] [Day of Week]`, so a leading seconds field is optional | 6-field support, paste-ready Schedule Trigger node (typeVersion 1.2; the node lists 1, 1.1, 1.2, 1.3, 1.4) | `packages/nodes-base/nodes/Schedule/ScheduleTrigger.node.ts` |
| Docs: "The sixth asterisk in the Cron expression represents seconds. Setting this is optional." Example `*/10 * * * * *` = every 10 seconds | n8n section, preset | n8n-docs `scheduletrigger/README.md` (docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.scheduletrigger) |
| The node uses the workflow time zone if set, otherwise the instance time zone; self-hosted uses `GENERIC_TIMEZONE` (default America/New_York); Cloud admins set it in the admin dashboard | n8n section, FAQ | Schedule Trigger docs and common-issues page; self-hosted time zone page; Cloud "Set the timezone" page (search snippets); `this.getTimezone()` in `ScheduleTrigger.node.ts` |
| Schedule changes and variables in the expression only apply after the workflow is published again | n8n section step 4 | n8n-docs `scheduletrigger/common-issues.md` |
| n8n schedules cron with the `cron` npm package (kelektiv/node-cron, catalog version 4.4.0) | Day-rule warning | `packages/core/src/execution-engine/scheduled-task-manager.ts` (`import { CronJob, CronTime } from 'cron'`), `pnpm-workspace.yaml` |
| That library ORs day-of-month and day-of-week only when neither field covers every value; standard (Vixie) cron decides by whether the field starts with `*`. So `0 0 */2 * 1` differs | `cron-n8n-note` warning with n8n's next runs | kelektiv/node-cron `src/time.ts` (`_getNextDateFrom`) |
| The library accepts 3-letter names only, `@yearly/@monthly/@weekly/@daily/@hourly` (not `@annually`/`@midnight`), day-of-week 0-7 with 7 = Sunday, and rejects backwards ranges and step 0 | Validation messages, macro note | kelektiv/node-cron `src/constants.ts`, `src/time.ts` |
| HTTP Request node versions 3, 4, 4.1-4.5 share the V3 description; default version is 4.5 | Output uses typeVersion 4.2 for compatibility with older 1.x instances | `packages/nodes-base/nodes/HttpRequest/HttpRequest.node.ts` |
| Parameter names/values: `method`, `url`, `authentication` (`none`/`predefinedCredentialType`/`genericCredentialType`), `genericAuthType`, `sendQuery` + `queryParameters.parameters[]`, `sendHeaders` + `headerParameters.parameters[]`, `sendBody`, `contentType` (`json`, `form-urlencoded`, `multipart-form-data`, `raw`, `binaryData`), `specifyBody` (`json`/`keypair`/`string`), `jsonBody`, `bodyParameters.parameters[]` (`parameterType` `formData`/`formBinaryData`, `inputDataFieldName`), `rawContentType`, `body`, `options.allowUnauthorizedCerts`, `options.timeout` | Node JSON | `packages/nodes-base/nodes/HttpRequest/V3/Description.ts` |
| For typeVersion 4.x, Redirects → Follow Redirects defaults to true (max 21), so `-L` is not needed | `-L` note | Same file (redirect option hidden for `@version` 1-3) |
| Generic credential types `httpBasicAuth`, `httpHeaderAuth`, `httpQueryAuth` (and `httpBearerAuth`) exist with `genericAuth = true` | Credential mode | `packages/nodes-base/credentials/Http*Auth.credentials.ts`; docs `credentials/httprequest.md` |
| n8n's own Import cURL uses `curlconverter`, turns `-u` into a plain `Authorization: Basic …` header, keeps other auth headers in the parameters, and turns flat JSON into key/value fields | Honest positioning, FAQ | `packages/frontend/editor-ui/src/app/composables/useImportCurlCommand.ts`; docs "Import curl command" |
| Paste/import requires `nodes` and `connections`; nodes without `id` get a new id and nodes without `name` get one | Clipboard shape `{"nodes":[...],"connections":{}}` without ids | `packages/frontend/editor-ui/src/app/composables/useCanvasOperations.ts` (`importWorkflowData`) |
| Exported workflows include credential names and IDs, not secret values | Secret warning copy | docs.n8n.io/workflows/export-import (search snippet) |

## Cron Expression Generator

Competitors: Crontab.guru (Cronitor), Crontab-generator.org, FreeFormatter Cron Expression Generator (Quartz),
n8n-focused pages (Hndy Tools "N8N Cron Schedule Trigger", TheDigiZone).

| Capability | Competitors | This tool |
| --- | --- | --- |
| Plain-English explanation | All | Yes, including lists, ranges, steps, names and seconds |
| Next run times | crontab.guru (5; next 10 on scroll), several clones | Next 10 in any IANA zone, quick picks UTC / Asia/Dubai / Asia/Karachi, defaults to the browser zone |
| Generator from dropdowns | crontab-generator.org, FreeFormatter | Builder: every N minutes/hours, daily, weekdays, chosen days, monthly, yearly |
| Validation that names the wrong field | crontab.guru highlights; most clones only say "invalid" | Per-field chips turn red with a specific message; Quartz-only syntax (`?`, `L`, `W`, `#`, year) explained |
| DOM/DOW OR rule | crontab.guru mentions it in tips | Explicit notice on the result, plus a warning when n8n's library evaluates the expression differently |
| Presets / examples | All | 12 business schedules (incl. Sun-Thu work week, quarterly, 6-field seconds) |
| Shareable URL | crontab.guru | "Copy link" with `#expr=` |
| n8n instructions | n8n pages (text only) | Steps, time zone rules with sources, paste-ready Schedule Trigger node |
| Quartz syntax | FreeFormatter | Not supported (backlog); n8n does not accept it |

## cURL to n8n Converter

Competitors: n8n's built-in Import cURL, curlconverter.com, FlowEngine cURL to n8n, Ihor Chyshkala cURL to n8n.

n8n already imports cURL inside the HTTP Request node, so the page says so and positions this tool on what the
built-in import does not do.

| Capability | Competitors | This tool |
| --- | --- | --- |
| Parse method, URL, headers, body | All | `-X -H -d --data-raw --data-binary --data-urlencode --json -F --form-string -u -G -I -A -e -b --oauth2-bearer -k -m`, query strings, `\` continuations, single/double/`$'…'` quotes |
| Output pasteable into n8n | n8n (in place), FlowEngine, Chyshkala | `{"nodes":[...],"connections":{}}` verified against n8n's paste code; Download .json |
| Secrets | Not mentioned by any competitor snippet; n8n import keeps them in parameters | Detects auth/API-key/token headers, key/token query params, password/secret body fields; moves one into a Basic/Header/Query Auth credential, or uses placeholders |
| Explain each field | None found | Mapping table (n8n field / value / from cURL) and notes for ignored or changed options |
| Batch conversion | None found | Several commands in one paste, nodes laid out side by side |
| JSON types preserved | n8n import turns flat JSON into string key/value fields (docs note) | JSON bodies always use "Using JSON", so numbers, booleans and nesting survive |
| Ignored flags explained | curlconverter warns on some | `--compressed`, `-s`, `-S`, `-L`, `-v`, `-i`, `-f`, `-o` notes |
| Many target languages | curlconverter | Out of scope |

## QA notes

- Next-run iterator converts wall-clock times with `Intl.DateTimeFormat` only (no dependency); DST gaps are
  skipped and repeated hours run once (noted on the page). Tests freeze time with `page.clock` and cover UTC,
  Asia/Dubai, Asia/Karachi (browser default), the DOM/DOW OR case, a step/range case and month-end (31st, 29 Feb,
  impossible 30 Feb).
- cURL tests assert the exact node JSON for 9 commands and check the clipboard contents.
- Both pages: one H1, SEO title, WebApplication/FAQPage/HowTo JSON-LD, the developer "Need this inside a real
  workflow?" automation CTA, and no horizontal overflow at 390 px.

## Backlog

- Cron: Quartz mode, calendar view, compare two expressions, .ics export.
- cURL: Windows cmd `^` and PowerShell continuations, proxy/cookie-jar options, connecting batch nodes, pagination hints.

## Sources

- Cron: https://crontab.guru/, https://crontab.guru/tips.html, https://crontab-generator.org/, https://www.freeformatter.com/cron-expression-generator-quartz.html, https://www.hndytools.com/tools/n8n-cron-schedule-trigger, https://thedigizone.com/developer/cron-generator/, https://cronitor.io/guides/cron-troubleshooting-guide
- n8n Schedule Trigger: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.scheduletrigger/, https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.scheduletrigger/common-issues/, https://docs.n8n.io/hosting/configuration/configuration-examples/time-zone/, https://docs.n8n.io/manage-cloud/set-cloud-timezone/, https://github.com/n8n-io/n8n/blob/master/packages/nodes-base/nodes/Schedule/ScheduleTrigger.node.ts, https://github.com/n8n-io/n8n/blob/master/packages/core/src/execution-engine/scheduled-task-manager.ts, https://github.com/kelektiv/node-cron/blob/main/src/time.ts
- cURL: https://curlconverter.com/, https://github.com/curlconverter/curlconverter, https://flowengine.cloud/curl-to-n8n, https://chyshkala.com/tools/developers/curl-to-n8n, https://github.com/n8n-io/n8n/issues/11662
- n8n HTTP Request: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/, https://docs.n8n.io/integrations/builtin/credentials/httprequest/, https://github.com/n8n-io/n8n/blob/master/packages/nodes-base/nodes/HttpRequest/V3/Description.ts, https://github.com/n8n-io/n8n/blob/master/packages/frontend/editor-ui/src/app/composables/useImportCurlCommand.ts, https://github.com/n8n-io/n8n/blob/master/packages/frontend/editor-ui/src/app/composables/useCanvasOperations.ts, https://docs.n8n.io/workflows/export-import/
