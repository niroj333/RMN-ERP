# Volume 07 — UI/UX Engineering Specification

**Document Status:** AUTHORITATIVE
**System:** RMN ERP
**Context:** Modular Monolith, Domain-Driven Design
**Related EWPs:** EWP-0001, EWP-0002, EWP-0003, EWP-0101, EWP-0201, EWP-0018, ADR-0020, EWP-1001

---

## 1. Design Philosophy
The RMN ERP user interface is designed for high-density, functional enterprise use. The primary goals are clarity, speed of data entry, and reduction of cognitive load. 
- **Functional Enterprise First:** Aesthetics must never compromise usability or legibility.
- **Progressive Disclosure:** Complex forms and data sets should reveal advanced options only when necessary.
- **Consistency:** Interaction patterns must be uniform across all bounded contexts and modules.
- **Predictability:** System behavior (saving, error handling, navigation) must behave identically regardless of the specific domain.

## 2. Glass vs Solid Surfaces (EWP-1001)
The UI leverages a dual-material design system to differentiate between consumption and creation/editing of data.

- **Solid Surfaces (Required for Forms):** Must be used for all data entry forms, configuration panels, and administrative screens. Solid, high-contrast backgrounds are mandatory to ensure readability, accessibility, and focus during data mutation.
- **Glass Surfaces (Summaries Only):** Translucent or "glassmorphism" effects are restricted entirely to summary surfaces, dashboards, and the Student 360 overview. They must not be used in contexts requiring sustained reading or complex data entry.

## 3. Component Hierarchy
The UI architecture is built on a strict hierarchy to ensure modularity and reusability across plugins.

1. **Application Shell:** The outermost container providing global navigation, user profile, and system status.
2. **Page Templates:** Standardized layouts (e.g., Master-Detail, Dashboard, Multi-step Form).
3. **Data Tables & Lists:** Complex data presentation components with integrated filtering.
4. **Form Components:** Field groups, sections, and dynamic form renderers (ADR-0020).
5. **Base Elements:** Buttons, inputs, typography, and icons.

## 4. Reusable Components
To satisfy modular ERP requirements, specific high-level domain components must be globally reusable across contexts:

- **Person Search & Selector (EWP-0101):** A unified component for finding and selecting individuals. Must support partial matching and display a standardized mini-profile (Avatar, ID, Name).
- **Organization Selector (EWP-0201):** A hierarchical selector for navigating the organization tree and selecting specific nodes (departments, campuses, external orgs).
- **Reference Data Dropdown (EWP-0018):** A standardized single/multi-select component bound to the Reference Data service. Must support caching and local filtering.
- **Standard Address Form:** A locale-aware form group for address entry, utilizing reference data for region/country selection.

## 5. Form Patterns
- **Required Fields:** Must be explicitly marked (e.g., with an asterisk `*`). Do not rely solely on color.
- **Validation:** Validation occurs client-side for immediate feedback, but the server is the ultimate source of truth.
- **Error States:** Field-level errors must display inline immediately below the input. A summary of all errors must be presented at the top of the form or near the primary submit action.
- **Success Feedback:** Transient toast notifications for standard operations; dedicated success screens for complex workflows (e.g., Enrollment).
- **Dynamic Rendering (ADR-0020):** Dynamic fields must utilize approved rendering hooks and seamlessly integrate with static form elements.

## 6. Data Table Patterns
- **Pagination:** Cursor-based pagination is the default for all end-user data tables (e.g., "Load More" or continuous scrolling). Offset-based pagination is permitted only for specific administrative screens requiring exact page jumps.
- **Filtering & Sorting:** Column headers must clearly indicate sort state. Filters should be exposed in a dedicated panel or inline row beneath headers.
- **Actions:** Row-level actions (Edit, View) typically appear at the end of the row.
- **Bulk Operations:** Multi-select must reveal a contextual action bar replacing or overlaying the standard table toolbar.

## 7. Permission-Aware UI (EWP-0002)
- **Visual Adaptation:** The UI must aggressively adapt based on the user's evaluated permissions. Actions the user cannot perform must be either hidden entirely (preferred for simplicity) or disabled with a tooltip explaining the restriction (preferred for transparency).
- **Zero Trust:** UI components hiding a feature DO NOT replace server authorization. The backend API must independently verify all permissions on every request.
- **Access Denied:** Direct navigation to unauthorized views must gracefully render a standardized "Access Denied" state, not a generic 404 or application crash.

## 8. Accessibility
- **Standard:** The UI must comply with WCAG 2.1 AA standards.
- **Keyboard Navigation:** All interactive elements must be reachable and operable via keyboard. Focus states must be highly visible.
- **Screen Readers:** ARIA attributes must be applied to all dynamic components (modals, toasts, custom dropdowns). Data tables must include appropriate semantic markup.
- **Color Contrast:** Text and critical UI boundaries must meet the 4.5:1 contrast ratio.

## 9. Responsive Design
- **Desktop First:** As an ERP, the primary use case is desktop environments (1024px width and above). Complex data grids and multi-column forms are optimized for these displays.
- **Graceful Degradation:** The UI must degrade gracefully to tablet sizes. Mobile support is limited to specific "mobile-first" workflows (e.g., student self-service); complex admin screens may require horizontal scrolling on small devices.

## 10. Error & Loading States
- **Loading:** Use skeleton screens for page loads and data-heavy components to reduce perceived latency. Avoid blocking global spinners unless submitting a mutation.
- **Error Boundaries:** The application must utilize error boundaries to isolate component crashes. A failure in a plugin component must not crash the entire application shell.
- **Retry:** Network failures should present a clear "Retry" action rather than a dead end.

## 11. Navigation
- **Global Sidebar:** Collapsible left-side navigation organized by primary bounded context (e.g., Core, IAM, Student).
- **Breadcrumbs:** Mandatory on all hierarchical pages deeper than the primary module index.
- **Context Switching:** If a user operates across multiple organizations or roles, a clear global context switcher must be present in the application header.

## 12. Modal & Dialog Patterns
- **Destructive Confirmations:** Must require explicit confirmation (e.g., typing a word or checking a box) for high-risk actions.
- **Step-Up Authentication (EWP-0003):** High-privilege actions trigger a mandatory modal overlay requiring credential re-verification before proceeding.
- **Form Modals:** Use modals only for brief, single-step data entry tasks (e.g., adding a quick reference data entry). Multi-step or complex data entry must route to a dedicated page or slide-out panel to preserve context.
