# Chamtaburu Web Platform — Planning Docs

Planning and specification documents for rebuilding the Chamtaburu web presence.

| Doc | What's in it |
|---|---|
| [01-strategy.md](01-strategy.md) | Goals, positioning, brand system, site map |
| [02-architecture.md](02-architecture.md) | Tech stack, routing, hosting, cost model |
| [03-content-model.md](03-content-model.md) | Data schema, the seven cottages, copy inventory |
| [04-photography.md](04-photography.md) | Photo audit, image→page mapping, reshoot list |
| [05-build-phases.md](05-build-phases.md) | Phased execution plan with acceptance criteria |
| [06-open-questions.md](06-open-questions.md) | Decisions and information still needed |

## Status

**Planning complete — awaiting go-ahead to begin Phase 0.**

## Source material

- `photos/CHAMTABURU ECO VILLAGE.docx` — the Eco Village brand and guest-experience
  vision. This is the authoritative source for cottage identities, brand line, and
  design language. Much of [03-content-model.md](03-content-model.md) derives from it.
- `photos/eco_village/`, `photos/eco_resort/` — 18 property photographs, audited in
  [04-photography.md](04-photography.md).

## The one-paragraph summary

The existing repository is a visually attractive prototype generated in Google AI
Studio, not a working hotel website. It contains two conflicting designs for the same
properties, entirely placeholder photography, room data that does not match the real
property, a non-functional fake checkout, unusable legal text, and zero SEO. The plan is
to consolidate to a single design system, drive all content from typed data files, build
the seven named Eco Village cottages as first-class pages (each with its own QR-linkable
URL), replace the fake checkout with a WhatsApp enquiry flow, add proper SEO, and move
hosting from Cloud Run to Firebase Hosting at effectively zero monthly cost.
