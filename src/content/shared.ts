/**
 * Content shared across both sites: group/legal identity and the data the
 * legal pages will eventually be built from.
 *
 * Per docs/03-content-model.md §6, full policy text is NOT written here —
 * it needs a lawyer/CA review before it can ship (privacy, T&C, refund
 * terms especially). This file provides the structured facts (legal name,
 * GSTIN, registered detail, status) that the eventual policy copy will
 * reference, plus explicit TBD markers for what's still missing
 * (docs/06-open-questions.md Q5). src/components/pages/Legal.tsx keeps
 * its existing "Full policy text pending" placeholder copy — this is the
 * data layer underneath it, not a rewrite of that copy.
 */

export interface LegalPolicyStatus {
  title: string;
  status: 'drafted' | 'pending';
  note: string;
}

export const groupInfo = {
  legalName: 'Chamtaburu Eco Village & Resort Pvt. Ltd.',
  gstin: '19AAUFC4653K1ZR',
  // Registered address not yet confirmed as distinct from either property
  // address — see docs/03-content-model.md §2 and §6. Do not invent one.
  registeredAddress: 'TBD',
};

export const legalPolicies: LegalPolicyStatus[] = [
  {
    title: 'Privacy Policy',
    status: 'pending',
    note: 'Full policy text pending — see docs/03-content-model.md §6.',
  },
  {
    title: 'Terms & Conditions',
    status: 'pending',
    note: 'Full policy text pending — see docs/03-content-model.md §6.',
  },
  {
    title: 'Refund & Cancellation Policy',
    status: 'pending',
    note: 'Full policy text pending — see docs/03-content-model.md §6 and docs/06-open-questions.md Q5 (needs the actual cancellation terms before it can be drafted).',
  },
  {
    title: 'Guest Information',
    status: 'pending',
    note: 'Full policy text pending — see docs/03-content-model.md §6 (children policy, extra beds, pets, smoking, alcohol, quiet hours).',
  },
];

/**
 * Social links, group-wide. No confirmed URLs exist yet
 * (docs/06-open-questions.md Q9) — every key is intentionally absent
 * rather than pointing at an invented or placeholder URL. Footer only
 * renders an icon for a key that is present, so an empty object here
 * correctly hides all social icons instead of linking them nowhere.
 */
export const social: { facebook?: string; instagram?: string; youtube?: string } = {};
