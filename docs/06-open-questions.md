# 06 — Open Questions

What is still needed, and when. **Nothing here blocks Phases 0–3**, so work can start
before any of it is answered.

## Blocking

### Q1 — Are all seven cottages actually built and bookable? — ANSWERED 2026-11-07
Yes: all seven are open, and 02 Karam Kunja, 03 Mahua Ghar and 04 Palash Kunja are AC. The property numbers them 01 Shal Shanti, 02 Karam Kunja, 03 Mahua Ghar, 04 Palash Kunja, 05 Pahari Chaya, 06 Jharna Neer, 07 Adivasi Aangan, which the website now follows.

_Original question:_
The vision doc describes seven. The photographs appear to show four or five structures,
some with construction debris still visible. If only some are ready, the site should
list the ready ones as bookable and present the rest as "opening soon" — that is honest
and it builds anticipation. Listing a cottage a guest cannot book generates complaints.

**Needed by:** Phase 4. **Form:** which of the seven are ready now.

### Q2 — Cottage prices, occupancy and bed configuration — ANSWERED 2026-11-08
Every cottage: 300 sq ft, an extra-large king bed, 2 adults + 1 child (up to 5 with extra mattresses); TV, Wi-Fi, hot water, attached bathroom, private lawn with a swing, hill view from the balcony; 02–04 AC. Prices come from the rate calendar (Cottage ₹5,000, AC Cottage ₹5,500 normal rates).

_Original question:_
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

### Q3 — Eco Resort rooms and prices — ANSWERED 2026-10-05
Confirmed by the owner: five room types — Bamboo Cottage (₹2,000/night, 2 adults + 1
child, 1 queen bed), Double Bedded (₹1,600, 2 adults + 1 child, 1 king bed), Triple
Bedded (₹1,800, 3 adults + 1 child, 2 queen beds; AC variant ₹2,200), Four Bedded
(₹2,100, 4 adults, 2 queen beds; AC variant ₹2,500), Six Bedded (₹2,700, 6 adults + 1
child, 2 king beds; AC variant ₹3,300). All prices include breakfast and before GST.
All five are bookable now. Populated in `src/content/resort.ts`; photos processed via
`scripts/photos.mjs` from `photos/eco_resort/<room-type>/`.

## Needed before launch

### Q4 — Food and dining — ANSWERED 2026-11-08
The menu at /menu is current for both properties. Meals are served in the dining hall, or in the cottage / room on request. (Vegetarian and Jain catering not stated; the site only says what the menu shows: veg, egg and non-veg dishes.)

_Original question:_
What is actually served? Fixed menu or à la carte? Bengali, tribal, or general Indian?
Is there a dining hall, or is food served at the cottage? Any signature dish worth
naming? Vegetarian and Jain options? This is among the top three questions guests ask
before booking, and there is currently nothing about it on the site.

### Q5 — Cancellation and refund policy — ANSWERED 2026-11-08
Full refund at least 25 days before check-in; within 25 days, 90% of the room tariff is charged; no-shows not refunded; refunds in 3–7 business days; 50% advance confirms a booking; government ID from all guests and visitors. On /legal (src/content/shared.ts), with drafted Privacy Policy and Terms the owner approved. Still open: pets, smoking, alcohol, quiet hours.

_Original question:_
Your actual terms. For example: *free cancellation up to 7 days before check-in; 50%
refund 3–7 days; no refund within 72 hours; no-show forfeits the full amount.* I will
write the formal language — I need the numbers. This must be real, not invented, because
guests will hold you to it.

Also needed: check-in and check-out times, ID requirements, children policy, pets,
smoking, alcohol.

### Q6 — GPS coordinates for both properties — ANSWERED 2026-11-08
Village: https://maps.app.goo.gl/6k432JfLCnnUpjcR8 (23.1209367, 86.0800183) with the owner's embed; Resort answered 2026-10-05. Both Contact pages show the map.

_Original question:_
Open Google Maps, drop a pin on each property, and copy the latitude/longitude. Required
for `LodgingBusiness` structured data, the embedded map, and the "Get Directions" link.
Two pairs of numbers — Matha (Village) and Sankupi (Resort).

### Q7 — Bengali spellings of the seven cottage names
Confirmation of the Bengali script for each (e.g. Shal Shanti → শাল শান্তি). Authentic,
attractive, and helps Bengali-language search. If you would rather keep the site
Latin-only, that is also a valid answer.

### Q8 — Directions from Kolkata and Purulia — ANSWERED 2026-11-08
Driving: Kolkata 6–7 hrs, Durgapur about 4½ hrs, Ranchi about 3 hrs. Nearest stations Purulia and Barabhum, with pickup by car. On both Contact pages.

_Original question:_
The route guests actually drive, the drive time, the last reliable fuel stop, road
condition in monsoon, and nearest railway station (Purulia Jn? Barabhum?) with distance.
Also: is the final approach navigable by a low-clearance car, and is there parking?
"How do I get there" is one of the most-visited pages on any rural property site.

### Q9 — Social media accounts — ANSWERED 2026-11-08
Village: facebook.com/chamtaburuecovillage, instagram.com/chamtaburu_ev, youtube.com/@ChamtaburuEcoVillage, Google review g.page/r/CQqkiqTaflPCEBE/review. Resort answered 2026-10-05.

_Original question:_
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
