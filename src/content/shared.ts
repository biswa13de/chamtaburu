/**
 * Content shared across both sites: group/legal identity and the policies on
 * /legal (src/components/pages/Legal.tsx).
 *
 * The booking terms (cancellation, refunds, advance, ID, tariff, check-in and
 * check-out, children) are the owner's own, given 2026-11-08. The Privacy
 * Policy and the general terms around them are a standard draft written to
 * fit, approved for use by the owner; have a lawyer or CA look over them when
 * convenient (docs/03-content-model.md §6). Nothing here may promise what the
 * owner hasn't stated (pets, smoking, alcohol, quiet hours are still open).
 */
import type { SiteConfig } from './types';

export const groupInfo = {
  legalName: 'Chamtaburu Eco Village & Resort Pvt. Ltd.',
  gstin: '19AAUFC4653K1ZR',
};

/** When the policies below last changed: shown on /legal. */
export const POLICIES_UPDATED = '8 November 2026';

/** A paragraph, or a bulleted list. */
export type PolicyBlock = string | { list: string[] };

export interface PolicySection {
  id: string; // anchor on /legal, e.g. /legal#cancellation
  title: string;
  blocks: PolicyBlock[];
}

export function policiesFor(site: SiteConfig): PolicySection[] {
  return [
    {
      id: 'booking',
      title: 'Booking & Payment',
      blocks: [
        {
          list: [
            'Send us a booking request on this website, on WhatsApp or by phone. We confirm availability and send you a package with the total price, including GST.',
            'Your booking is confirmed once we receive an advance of 50% of the booking amount.',
            'Room tariffs are subject to change without prior notice. Confirmed bookings are honoured at the agreed booking rate.',
          ],
        },
      ],
    },
    {
      id: 'cancellation',
      title: 'Cancellation & Refunds',
      blocks: [
        {
          list: [
            'Cancellations made at least 25 days before the check-in date are eligible for a full refund, with no cancellation charges.',
            'For cancellations made within 25 days of the check-in date, 90% of the total room tariff is charged as a cancellation fee.',
            'No-shows are not refunded.',
            'Refunds are processed within 3–7 business days.',
          ],
        },
        `To cancel, message or call us on ${site.phones[0]}, or email ${site.email}.`,
      ],
    },
    {
      id: 'stay',
      title: 'Your Stay',
      blocks: [
        {
          list: [
            `Check-in: ${site.checkIn}. Check-out: ${site.checkOut}.`,
            `Reception is open ${site.receptionHours}.`,
            'For the safety and security of all our guests, valid government-issued ID proof is required from all guests, including visitors, at the time of check-in.',
            'On package plans, children aged 5–10 pay half the adult rate, and children under 5 stay free.',
            'Meals are served in the dining hall, or in your room on request.',
          ],
        },
        'We appreciate your cooperation and look forward to welcoming you to Chamtaburu!',
      ],
    },
    {
      id: 'terms',
      title: 'Terms & Conditions',
      blocks: [
        `These terms apply to stays at ${site.name} and to the use of ${site.domain}, run by ${groupInfo.legalName}.`,
        {
          list: [
            'Prices on this website are per room per night unless stated otherwise. GST is added as applicable, and your package shows the final total.',
            'Please take care of the rooms, furnishings and grounds. Damage beyond normal use may be charged.',
            'We may decline or end a stay if a guest’s conduct puts other guests, our staff or the property at risk.',
            'We take care to keep this website accurate, but photos and descriptions are a guide, and sightseeing places and timings outside the property may change.',
            'These terms are governed by the laws of India.',
          ],
        },
      ],
    },
    {
      id: 'privacy',
      title: 'Privacy Policy',
      blocks: [
        'We collect only what we need to look after your booking and your stay:',
        {
          list: [
            'The details you give us when you send a booking request or an enquiry: your name, phone number, dates, number of guests and any notes.',
            'ID proof at check-in, as described under Your Stay.',
            'Payment details are handled by our payment provider; we don’t see or store your card or bank details.',
            'Anonymous visit statistics from Google Analytics, which uses cookies, so we know which pages are useful.',
          ],
        },
        'We use your details to reply to you, arrange and confirm your stay, and meet our legal obligations. We do not sell or rent them to anyone. We share them only with the services that help us run bookings (such as our payment provider and the systems that store booking requests), or with authorities where the law requires it.',
        `To see, correct or delete the details we hold about you, email ${site.email}.`,
      ],
    },
  ];
}
