import { Section } from '../ui/Section';
import { Prose } from '../ui/Prose';

// Placeholder structure; real drafted policy text lands in Phase 2 (§6 of
// the content model) — the garbled prototype copy has been removed here.
export function Legal() {
  return (
    <Section narrow className="space-y-16 py-24">
      <div className="space-y-4 text-center">
        <h1 className="font-serif text-5xl font-medium">Legal Policies</h1>
        <p className="text-sm uppercase tracking-widest text-stone">Chamtaburu Eco Village & Resort Pvt. Ltd.</p>
      </div>

      <div className="space-y-12">
        <Prose>
          <h2>Privacy Policy</h2>
          <p>Full policy text pending — see docs/03-content-model.md §6.</p>
        </Prose>
        <Prose>
          <h2>Terms &amp; Conditions</h2>
          <p>Full policy text pending — see docs/03-content-model.md §6.</p>
        </Prose>
        <Prose>
          <h2>Refund &amp; Cancellation Policy</h2>
          <p>Full policy text pending — see docs/03-content-model.md §6.</p>
        </Prose>
      </div>
    </Section>
  );
}
