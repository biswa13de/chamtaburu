# 06 — Open Questions

What is still needed, and when. **Nothing here blocks Phases 0–3**, so work can start
before any of it is answered.

## Blocking

### Q1 — Are all seven cottages actually built and bookable?
The vision doc describes seven. The photographs appear to show four or five structures,
some with construction debris still visible. If only some are ready, the site should
list the ready ones as bookable and present the rest as "opening soon" — that is honest
and it builds anticipation. Listing a cottage a guest cannot book generates complaints.

**Needed by:** Phase 4. **Form:** which of the seven are ready now.

### Q2 — Cottage prices, occupancy and bed configuration
Not in the vision doc, and the existing prices in the code are invented. Per cottage:

| Field | Example |
|---|---|
| Price per night (before GST) | ₹2,400 |
| Maximum occupancy | 2 adults + 1 child under 5 |
| Bed configuration | 1 king / 2 queen / … |
| Extra bed charge | ₹500 |
| Weekend or seasonal rate | if applicable |

If all seven are priced identically, say so — that is simpler and fine.

Also: is breakfast included? Are meals included, optional, or a fixed plan? This changes
how the price is presented and is one of the most common pre-booking questions.

**Needed by:** Phase 4. **Form:** a list or a photo of your rate card.

### Q3 — Eco Resort rooms and prices
The current list — Special Bamboo Cottage ₹2,000, Double Bed ₹1,800, Quadruple ₹2,400,
Family ₹3,599 — is prototype fiction. The photos do show bamboo and thatch structures,
so the Bamboo Cottage is plausible; the rest is unverified. Need the real room types,
count of each, capacity and prices.

**Needed by:** Phase 7.

## Needed before launch

### Q4 — Food and dining
What is actually served? Fixed menu or à la carte? Bengali, tribal, or general Indian?
Is there a dining hall, or is food served at the cottage? Any signature dish worth
naming? Vegetarian and Jain options? This is among the top three questions guests ask
before booking, and there is currently nothing about it on the site.

### Q5 — Cancellation and refund policy
Your actual terms. For example: *free cancellation up to 7 days before check-in; 50%
refund 3–7 days; no refund within 72 hours; no-show forfeits the full amount.* I will
write the formal language — I need the numbers. This must be real, not invented, because
guests will hold you to it.

Also needed: check-in and check-out times, ID requirements, children policy, pets,
smoking, alcohol.

### Q6 — GPS coordinates for both properties
Open Google Maps, drop a pin on each property, and copy the latitude/longitude. Required
for `LodgingBusiness` structured data, the embedded map, and the "Get Directions" link.
Two pairs of numbers — Matha (Village) and Sankupi (Resort).

### Q7 — Bengali spellings of the seven cottage names
Confirmation of the Bengali script for each (e.g. Shal Shanti → শাল শান্তি). Authentic,
attractive, and helps Bengali-language search. If you would rather keep the site
Latin-only, that is also a valid answer.

### Q8 — Directions from Kolkata and Purulia
The route guests actually drive, the drive time, the last reliable fuel stop, road
condition in monsoon, and nearest railway station (Purulia Jn? Barabhum?) with distance.
Also: is the final approach navigable by a low-clearance car, and is there parking?
"How do I get there" is one of the most-visited pages on any rural property site.

### Q9 — Social media accounts
Facebook, Instagram, YouTube URLs. The footer icons currently link nowhere. If accounts
do not exist yet, I will remove the icons rather than ship dead ones.

### Q10 — Domain and infrastructure access
For Phase 6: where `chamtaburu.in` DNS is managed (registrar or Cloudflare), and access
to the GCP/Firebase project. Also — is `chamtaburu.com` yours? The old site used
`info@chamtaburu.com`, and if you own the `.com` it should redirect to `.in` rather than
sit unused or, worse, be registered by someone else.

## Nice to have

### Q11 — Guest reviews or testimonials
Any Google, MakeMyTrip, or Booking.com reviews you would like quoted, with the guest's
first name and month. Social proof is among the strongest conversion levers, and you may
already have it.

### Q12 — Video
Even a steady 30-second phone clip of the property, the bonfire, or the hills would be
valuable. [VideoModal.tsx](../src/components/VideoModal.tsx) already supports YouTube and
Vimeo, so the plumbing exists — there is simply no video.

### Q13 — Is the Resort older than the Village?
The photographs suggest the Resort is an established property with mature hedges and
painted murals, while the Village is newly built. If so, "established since [year]" is
worth saying — longevity is reassuring — and it clarifies how the two properties should
be positioned relative to each other.

---

## What I need to start Phase 0 right now

**Nothing.** Phases 0–3 are cleanup, design system, content scaffolding, and the image
pipeline. All of it proceeds with what is already in the repository, using `TBD` markers
where facts are missing. The questions above become blocking around Phase 4.

The two most useful things you could send in the meantime:
1. **Full-resolution originals of the ten Village photographs** (not via WhatsApp) —
   free, and it fixes the hero resolution problem described in
   [04-photography.md](04-photography.md) §2.
2. **The cottage rate card** (Q2).
