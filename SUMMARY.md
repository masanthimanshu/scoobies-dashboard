# Scoobies Sales Dashboard: Technical Audit Summary

This document is raw material for technical interviews and resume development. It describes implemented behavior and verified architectural characteristics of the repository, while clearly separating production recommendations from current capabilities.

## 1. Executive Overview

### Elevator Pitch

Scoobies Sales Dashboard is a client-side React and TypeScript analytics workspace that converts heterogeneous sales CSV or TXT reports into an interactive commercial-performance view. It normalizes inconsistent column names, dates, numeric formats, statuses, and missing values, then exposes revenue, margins, orders, returns, products, channels, campaigns, trends, and geographic demand through coordinated filters and visualizations.

The application is designed for rapid, self-service analysis without a data warehouse or application backend: uploaded records remain in browser memory, all primary calculations run locally, and the optional AI advisor receives a compact analytical context rather than an indiscriminate dump of the full dataset. Users can export filtered records as CSV or generate a printable/PDF executive report.

### The North Star Metric

The primary product objective is to reduce the time and friction required to move from an operational sales report to an actionable commercial decision. The most useful measurable proxy is **time from CSV upload to a validated executive insight**, supported by secondary goals of preserving analytical consistency across filters, making return and margin leakage visible, and enabling leadership-ready report export.

## 2. Technical Stack Mapping

### Languages and Application Framework

- **TypeScript**: Provides explicit contracts for `SaleRecord`, `FilterState`, dashboard KPIs, chart series, channel/category/product metrics, geographic metrics, and AI context. This is particularly valuable because the input data is untyped and variable while the downstream dashboard expects stable fields.
- **React 19**: Fits the application’s component-oriented dashboard surface. Independent components own upload, filters, KPI cards, charts, tables, modals, reporting, and AI interactions while `App.tsx` coordinates shared state.
- **Vite**: Supplies a lightweight development server and fast production bundling for a static browser application with minimal operational overhead.
- **Tailwind CSS 4 with the Vite plugin**: Enables consistent responsive layouts and localized visual styling without introducing a large bespoke stylesheet or component framework.

### Data and Visualization Libraries

- **Papa Parse**: Handles header-aware CSV parsing, empty-line behavior, and row-level data traversal. It is a better fit than manual string splitting for quoted fields and real-world report variability.
- **Recharts**: Provides the dashboard’s time-series and comparative visualizations while allowing the application to pass already-aggregated metric models to presentation components.
- **`html2canvas` and `jsPDF`**: Turn the rendered executive report into a downloadable A4 PDF in the browser, avoiding a server-side document-generation service.
- **`marked`**: Renders Markdown returned by the AI advisor into readable executive briefings and chat responses.
- **`lucide-react`**: Supplies a consistent icon vocabulary for actions, statuses, navigation, and data-analysis affordances.

### AI and External Integration

- **Groq OpenAI-compatible chat completions API**: Provides optional low-latency interactive analysis using the configured `openai/gpt-oss-120b` model. Server-sent event parsing lets the UI display incremental response text.
- **Deterministic offline AI engine**: Keeps the core briefing workflow functional without an API key. It derives a strategic brief from local metrics, channel drivers, margin leaders, return watchlists, quota progress, and temporal velocity.

### Testing, Delivery, and Operations

- **Build validation**: TypeScript and Vite are used through the `npm run build` production build. The repository has no test, lint, preview, CI/CD, infrastructure-as-code, monitoring, or deployment scripts at present.
- **Deployment model**: The static bundle can be hosted by a conventional static web host. A production deployment should move Groq requests behind a server-side proxy and server-managed secret store rather than exposing a browser-available API key.

## 3. Engineering Achievements (The Gold Mine)

### Technical Win 1: Resilient Sales-Report Normalization

**The Challenge:** Sales reports frequently vary in header spelling, punctuation, capitalization, date representation, numeric formatting, status vocabulary, and completeness. A dashboard built against one exact spreadsheet schema would be brittle and costly to reuse.

**The Action:** Implemented `parseSalesCsv` in `src/utils/csvParser.ts` with Papa Parse and a normalization layer. `findValue` compares normalized header keys, allowing aliases such as `SKU`/`Bar Code`, `Quantity`/`QTY`, `Platform`/`Channel`, `Province`/`State`, and multiple order/date labels. `cleanNumber` strips currency symbols and thousands separators and handles placeholders such as `-`; `cleanString` removes common spreadsheet error values. Missing values receive explicit defaults, categories are normalized to uppercase, and dates are decomposed into year, month, day, ISO-like display text, and a timestamp.

**The Result:** Multiple report shapes converge into one stable `SaleRecord` contract. Downstream analytics and UI code can operate on predictable fields instead of repeating defensive parsing logic. Invalid rows are isolated into parse errors rather than preventing the entire import from completing.

### Technical Win 2: Return-Aware Financial and Operational Analytics

**The Challenge:** Returns must affect net sales, units, refund value, return rates, product rankings, channel economics, geography, and time trends consistently. Treating returns as ordinary negative or positive rows in each component would create duplicated and conflicting business logic.

**The Action:** Centralized transaction interpretation in `getRecordMetrics` and reused it throughout `computeDashboardMetrics`, `computeTimeSeries`, `computeChannelMetrics`, `computeCategoryMetrics`, `computeProductMetrics`, and `computeGeoMetrics`. Return detection considers explicit status, negative quantity, and negative sale value. Aggregations use `Set<string>` order identity to avoid counting line items as separate orders and use a shared safe percentage helper for denominator protection.

**The Result:** A single business rule drives gross sales, net sales, returned value, gross/net/returned units, AOV, margin rate, return rates, channel share, product return watchlists, and regional rankings. This improves consistency and makes the financial treatment of returns inspectable in one place.

### Technical Win 3: Memoized Analytical Projection Pipeline

**The Challenge:** The dashboard renders many views from the same filtered dataset. Recomputing every aggregation on every component render would make filter changes expensive and could cause views to disagree about the active data.

**The Action:** Kept the source records and filter state in `App.tsx`, derived `filteredRecords` once, and used `useMemo` for available filter metadata, core KPIs, time series, channel/category/product metrics, geography, executive insights, and AI context. The resulting metric models are passed into focused presentation components such as charts, KPI grids, tables, and analytics sections.

**The Result:** Filtering is a coherent state transition: every analytical surface and export receives the same active record set. Derived work is recalculated when its relevant inputs change, reducing unnecessary computation and creating a clean separation between orchestration, domain calculations, and rendering.

### Technical Win 4: Multi-Dimensional Self-Service Filtering

**The Challenge:** Commercial users need to compare periods and segments without writing queries or waiting for a data-team extract.

**The Action:** Implemented search and filters for years, months, weeks, date ranges, channels, categories, zones, states, dispatch/return status, B2S versus non-B2S campaign, and sale-value ranges. `FilterBar` supports multi-select time dimensions and dynamic options derived from the loaded dataset. The filter predicate in `filterRecords` applies the same rules to all consumers.

**The Result:** Users can move from a portfolio view to a narrow product, marketplace, period, campaign, or geography slice while retaining consistent KPIs, charts, tables, insights, AI context, and exports.

### Technical Win 5: Executive Insight Generation from Local Math

**The Challenge:** A dashboard should surface decisions, not only display raw charts. Leadership needs to see the strongest periods, leading channels, margin health, return risks, geographic leaders, and campaign contribution quickly.

**The Action:** Implemented `generateExecutiveInsights` with period maps for profitable months and weeks, top-channel ranking, margin thresholds, high-return product detection, zone leadership, and Back To School contribution. The logic emits typed insight objects with positive, warning, neutral, or highlight classifications and human-readable metrics.

**The Result:** The application produces repeatable, explainable executive highlights directly from the active filtered data, without requiring an AI service or manually authored commentary for each dataset.

### Technical Win 6: Token-Conscious Analytical Context and RAG-Lite Drill-Down

**The Challenge:** Sending every raw transaction to an LLM increases prompt size, cost, latency, and privacy exposure. Sending only a few KPIs loses the detail needed to answer questions about specific products or channels.

**The Action:** Built `buildDistilledContext` and `formatDistilledContextToMarkdown` in `src/utils/aiContextDistiller.ts`. The context includes dataset metadata, active filters, date span, financial KPIs, channel economics, top-volume products, top-margin drivers, return offenders, geographic leaders, and peak/trough periods. `extractTargetedMicroSlice` adds a focused top-SKU drill-down when a query names a known channel.

**The Result:** The AI layer receives a compact, structured analytical representation of the current view plus relevant detail on demand. This preserves filter context, limits unnecessary data transfer, and makes responses more decision-oriented than raw-row prompting.

### Technical Win 7: Offline-First Strategic Briefing

**The Challenge:** An external AI dependency should not block the user from receiving useful analysis, especially when no API key is configured or network access is unavailable.

**The Action:** Implemented `generateOfflineStrategicBrief` as a deterministic fallback over the distilled context. It reports net revenue, order and unit volume, margin health, quota progress, AOV, channel dominance, profit drivers, return risks, and demand velocity. `AiAdvisorDrawer` selects this path when `getActiveGroqApiKey` returns no key.

**The Result:** The dashboard retains a useful briefing workflow with zero network dependency and predictable outputs, while interactive custom questions remain an optional enhancement.

### Technical Win 8: Cancellable Server-Sent Event AI Streaming

**The Challenge:** Long AI responses should feel responsive, and users need a way to stop a generation that is irrelevant or too slow.

**The Action:** Implemented `streamGroqChat` with `fetch`, `ReadableStream.getReader()`, `TextDecoder`, buffered SSE line parsing, incremental accumulated content, explicit 401/429/general API errors, and `AbortSignal` support. The drawer updates the assistant message as chunks arrive and exposes stop/clear interactions.

**The Result:** Interactive responses render progressively rather than waiting for a complete payload, and active generations can be cancelled. Error messages are translated into actionable UI feedback for missing keys, invalid credentials, rate limiting, and missing streams.

### Technical Win 9: Browser-Native Data and Report Exports

**The Challenge:** Analysts need to take a filtered view into another workflow or share an executive snapshot without a separate reporting service.

**The Action:** Implemented filtered CSV generation with Papa Parse `unparse`, object-URL download handling, and an executive report view using `html2canvas` plus `jsPDF`. The report includes KPI cards, channel/category tables, top products, and delivery-city rankings, with browser print fallback behavior if PDF generation fails.

**The Result:** The active analytical slice can be exported without re-querying a backend, and the report path supports both downloadable PDF and native print workflows.

### Technical Win 10: Usable Dashboard Interaction Model

**The Challenge:** A dense analytics surface can become difficult to navigate on smaller screens or during repeated investigation.

**The Action:** Composed reusable controls and views with responsive Tailwind layouts, paginated and sortable order exploration, dynamic page sizes, modal upload/goal/report flows, keyboard shortcuts (`Cmd/Ctrl+J` for AI and `Escape` to close the drawer), drag-and-drop upload, loading/error states, and an empty-data state.

**The Result:** The application supports an end-to-end workflow from import to exploration to insight to export, with interaction states represented in the UI rather than requiring a separate operations console.

## 4. Architectural Highlights

### Data Flow

1. A user selects or drops a `.csv` or `.txt` file in `UploadModal`.
2. The file is read locally with `File.text()` and passed to Papa Parse.
3. `parseSalesCsv` maps source rows into normalized `SaleRecord` objects, derives date components and status, applies defaults, and returns records plus parse metadata.
4. `App.tsx` stores records and the uploaded filename in React state and resets filters for the new dataset.
5. `filterRecords` produces the active analytical slice.
6. Memoized analytics functions calculate KPIs and projections for time, channels, categories, products, zones, states, cities, and executive insights.
7. The same projections feed charts, tables, the report exporter, and `buildDistilledContext`.
8. The AI drawer either generates a local deterministic brief or sends the distilled Markdown context and optional targeted slice to Groq over a streamed HTTP request.
9. Users export the filtered records as CSV or render the active metrics into a PDF/print report.

### Architectural Patterns and Principles

- **Normalization boundary:** External, inconsistent report data is converted once at import time into an internal domain contract.
- **Pure functional domain calculations:** Filtering and metric functions are isolated from React rendering and can be reasoned about independently.
- **Single source of truth:** `App.tsx` owns the loaded dataset, filters, granularity, target, and modal/drawer state; child components receive data and callbacks through typed props.
- **Projection-oriented analytics:** Shared aggregation models avoid pushing raw-record interpretation into visual components.
- **Progressive enhancement:** Local deterministic intelligence is always available; network AI augments it when configured.
- **Defensive aggregation:** Set-based order counting, safe division, normalized values, and explicit empty states reduce common spreadsheet and dashboard failure modes.
- **Command/cancellation interaction:** AI generation is represented as an abortable operation with streamed state updates rather than a blocking request.

### Security, Privacy, and Trust Boundaries

- Uploaded sales data is processed in browser memory and is not persisted by the application after reload. This reduces server-side retention by default.
- The optional AI path sends distilled analytics context and a targeted data slice to Groq. The README warns against uploading sensitive or personally identifiable information without approval.
- API keys can be read from `localStorage` or a Vite-injected environment value. Because both paths make the key available to browser code, the current implementation is not suitable for protecting a production secret from users or browser extensions.
- No authentication, authorization, IAM role, encryption-at-rest policy, server-side secret manager, audit log, or tenant isolation is implemented in this repository. A production architecture should introduce a backend proxy, server-managed secret, access controls, data-classification rules, and transport/storage policies as needed.

### Scalability and Current Limits

The current architecture scales operationally by avoiding backend infrastructure and scales interaction performance through memoized projections, bounded AI context, paginated table rendering, and client-side aggregation. It is appropriate for small to moderate report sizes that fit comfortably in browser memory.

The principal growth limit is browser memory and single-threaded JavaScript execution: every row is loaded and aggregated in the main application context. For substantially larger datasets, the next architectural step would be worker-based parsing/aggregation or a server-side analytical store and query API. The AI context strategy already provides a useful boundary for controlling prompt growth, but it is not a substitute for a scalable data plane.

### Infrastructure and Delivery Assessment

The repository currently defines a Vite development command and a production build command only. There is no checked-in CI workflow, infrastructure-as-code, deployment manifest, monitoring integration, automated test suite, lint configuration, or production API proxy. These omissions are important interview context: the project demonstrates a complete client-side product workflow, while production hardening and operational automation remain follow-up work.

## 5. Potential KPI Suggestions

The following metrics should be measured or estimated from actual usage before turning the project into quantified resume bullets:

1. **Time to insight:** Median time from importing a report to identifying the first actionable margin, return, channel, or target finding.
2. **Manual reporting effort avoided:** Analyst hours or spreadsheet steps eliminated per reporting cycle through automatic normalization, filtering, aggregation, and PDF/CSV export.
3. **Dataset compatibility rate:** Percentage of incoming sales reports successfully imported without manual column renaming or preprocessing, plus percentage of rows retained after parsing.
4. **Interactive responsiveness:** P50/P95 time for CSV parsing, filter changes, and recomputation across representative row counts.
5. **AI efficiency:** Reduction in prompt tokens, payload size, or response latency achieved by distilled context and targeted micro-slices compared with sending raw records.
6. **Decision coverage:** Number of commercial dimensions available in one workflow, such as channels, categories, products, returns, campaigns, periods, zones, states, and cities, or the share of recurring questions answered without a custom extract.
7. **Return and margin impact:** Change in return rate, refunded value, gross margin, AOV, or quota attainment after teams act on dashboard-identified product/channel risks.
