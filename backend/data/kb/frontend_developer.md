---
doc_type: role
profession: frontend_developer
focus_area: Mixed
---

# Frontend Developer — Interview Coaching Knowledge Base

## Role overview

Frontend interviews evaluate whether you can build usable, performant, maintainable interfaces and collaborate with design and backend teams. Modern loops cover React or similar frameworks, browser fundamentals, accessibility, testing, and increasingly performance metrics (Core Web Vitals). Strong candidates connect UI decisions to user outcomes, not only component patterns.

## Core competencies

- Component architecture: composition, separation of concerns, reusable design systems
- State management: local vs global state, server state, caching (React Query, SWR)
- Performance: bundle size, code splitting, memoization, rendering bottlenecks, lazy loading
- Accessibility: semantic HTML, keyboard navigation, ARIA when needed, color contrast
- Testing: unit (components), integration, E2E (Playwright/Cypress), visual regression basics
- API integration: loading/error/empty states, optimistic updates, retry UX

## Interview themes

Live coding often involves building a small UI component or fixing a buggy React example. System questions may cover frontend architecture for large apps. Behavioral questions probe design collaboration, handling ambiguous specs, and shipping under deadlines without sacrificing quality.

## Question bank

**Technical:** Structure a complex dashboard or multi-step form. Global vs local state—when which? Common React performance issues and fixes. How do you ensure accessibility?

**Live exercise:** Implement searchable list, infinite scroll, modal with focus trap, or form with validation.

**Behavioral:** Conflicting feedback from design and product. A performance regression you fixed. Shipping a feature with incomplete backend API.

**Architecture:** How would you organize a Next.js app with auth, i18n, and shared design system?

## Strong answer framework

Explain user goal first, then component breakdown, data flow, and edge states (loading, error, empty). For performance stories cite metrics: LCP, bundle KB, re-render count, or interaction delay. For accessibility mention specific WCAG-oriented checks you performed.

## Strong answer signals

- Discusses error boundaries, skeleton states, and degraded UX
- Knows when not to use global state or heavy memoization
- Mentions design system tokens, not one-off CSS hacks
- Tests critical user paths and a11y with automated or manual checks
- Coordinates API contract changes with backend early

Example strong fragment: "We split the chart bundle with dynamic import, cutting initial JS by 120KB. LCP improved from 3.2s to 1.9s on mobile. I also added axe checks in CI for regressions on the checkout form."

## Weak answer signals and red flags

- Only CSS/framework trivia without user impact
- Ignores loading and error states in live coding
- Claims a11y but cannot describe keyboard or screen reader testing
- Over-engineers state management for simple UI
- No testing strategy beyond "QA tested it"

## Common interviewer follow-ups

- What re-renders when this state changes?
- How do you handle SEO in a SPA?
- How would you debug a hydration mismatch?
- What happens offline or on slow 3G?
- How do you prevent XSS when rendering user content?

## Seniority signals

**Junior:** Builds components from specs, learns patterns. **Mid:** Owns features, performance and a11y awareness, reviews PRs. **Senior:** Defines frontend architecture, design system strategy, performance budgets, cross-team standards.

## Coaching tips

Always narrate UX edge cases during live coding. Tie stories to business metrics: conversion, support tickets, task completion time. For Turkish e-commerce or fintech clients, mention peak campaign traffic and mobile-first constraints.
## Example answer snippets

**Weak:** "I used React hooks and Redux for state."
**Strong:** "Checkout had unnecessary re-renders on address form—React Profiler showed context provider wrapping the whole page. I split providers and memoized expensive child lists. Interaction delay improved ~200ms on mid-tier Android devices used heavily in our TR user base."

## Local market context

E-commerce and fintech UIs in Turkey are mobile-first. Interviewers value campaign-ready performance, Turkish locale formatting, and accessible forms for diverse users. Mention Core Web Vitals and real device testing when discussing performance.
## Deep-dive topic bank

Discuss: SSR hydration; CORS and cookie auth; list virtualization; image optimization; design tokens; controlled vs form libraries; error boundaries; micro-frontends; i18n/RTL; CSP impact. Tie each to user outcome or maintainability.
