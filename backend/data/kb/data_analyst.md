---
doc_type: role
profession: data_analyst
focus_area: Mixed
---

# Data Analyst — Interview Coaching Knowledge Base

## Role overview

Data analyst interviews evaluate SQL fluency, business metric literacy, dashboard craftsmanship, and the ability to turn messy data into decisions. Tools (SQL, Excel, Tableau, Power BI, Looker, Python) matter less than structured thinking: correct metric definition, sanity checks, clear narrative, and stakeholder-ready recommendations.

## Core competencies

- SQL: joins, aggregations, window functions, CTEs, performance basics
- Metrics: KPI definition, funnel analysis, cohorts, retention, LTV, conversion
- Data cleaning: nulls, duplicates, timezone issues, source discrepancies
- Visualization: chart choice, executive dashboards, drill-down design
- Communication: framing insights, limitations, and next actions for non-technical audiences
- Tools: Excel/Sheets, BI platforms, optional Python/pandas for automation

## Interview themes

Expect SQL exercises (often live or take-home), case questions on metric drops or funnel analysis, and behavioral questions on conflicting stakeholder requests. Product analytics roles add experimentation readouts; finance ops roles add reconciliation rigor.

## Question bank

**SQL:** Top N customers by revenue, month-over-month growth, session funnel, deduplicating events, cohort retention table.

**Case:** Conversion dropped 10% last week—investigate. Define KPIs for new feature launch. Executive asks for dashboard—what do you include?

**Behavioral:** Delivered analysis that changed a decision. Found error in someone else's report. Tight deadline with incomplete data.

## Strong answer framework

Restate business question. List data sources and assumptions. Show cleaning/validation steps. Define metric precisely (numerator/denominator, filters, time window). Present finding, uncertainty, and recommended action with expected impact.

## Strong answer signals

- Asks clarifying questions before querying (event definition, timezone)
- Sanity checks totals against known benchmarks or source systems
- Explains why visualization type fits the question
- Separates correlation from recommended action
- Automates recurring report to reduce manual error

Example strong fragment: "Signup conversion looked down 15%, but traffic mix shifted toward mobile web after a campaign. Segmenting by device, mobile app conversion was flat; mobile web had a broken payment redirect. Fix restored $40K weekly GMV."

## Weak answer signals and red flags

- SQL works but metric definition is vague or wrong
- Pretty charts without insight or recommendation
- Ignores data quality issues or small sample warnings
- Cannot explain query logic line by line when asked
- Analysis stops at description without "so what"

## Common interviewer follow-ups

- How would you validate this number with finance/ops?
- What biases exist in this dataset?
- How do you document metric definitions for the team?
- Optimize this slow query—what indexes or rewrites?
- How would you A/B readout for this feature?

## Seniority signals

**Junior:** Pulls reports from templates. **Mid:** Owns domain metrics and self-serve dashboards. **Senior:** Defines KPI framework, trains stakeholders, influences product decisions with rigorous analysis.

## Coaching tips

Always define the metric before writing SQL aloud in interviews. Keep one "metric rescue" story where you corrected a misleading dashboard. For Trendyol/Hepsiburada context, mention campaign peaks and funnel drop diagnosis.
## Example answer snippets

**Weak:** "I made a dashboard in Power BI showing sales."
**Strong:** "Sales dip was reported nationwide, but SQL cohort check showed dip isolated to one region after warehouse stockout. I joined inventory snapshots to sales by SKU-region-day and flagged root cause in standup. Misallocated marketing spend was redirected within 24 hours."

## Local market context

Trendyol/Hepsiburada-style analytics emphasizes funnel, campaign ROI, and seller/buyer metrics. Finance and bank analysts need reconciliation discipline. Document metric definitions to avoid dashboard conflicts.
## Deep-dive topic bank

SQL patterns: cohort retention; session funnels; LAG/LEAD trends; ROW_NUMBER dedup; sequential self-joins; SDK duplicate events; timezones; currency joins; null spikes; metric layer vs ad hoc.
