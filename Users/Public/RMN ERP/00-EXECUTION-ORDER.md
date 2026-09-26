# RMN ERP — Execution Order

1. EWP-0001 — Core Platform Foundation
2. EWP-0002 — Identity & Access Management
3. EWP-0003 — MFA & Step-Up Authentication
4. EWP-0101 — Universal Person Engine
5. EWP-0201 — Universal Organization Engine
6. EWP-0026 — Event Infrastructure
7. EWP-0018 — Master Data Domain
8. ADR-0020 implementation package — Enterprise Metadata Engine
9. EWP-1001 — Student Vertical Slice: Registration → Student 360

## Gate
Do not advance a P0 package until its Definition of Done passes, except explicitly approved parallel work.

## Architecture conflict
STOP and raise ADR/RFC. Never silently modify frozen architecture.

## Vertical-slice objective
The Student slice proves database → API → UI → authorization → events → audit → tests before broad module expansion.
