import { Section } from '../ui/Section';
import { Prose } from '../ui/Prose';
import { Seo } from '../ui/Seo';
import { groupInfo, policiesFor, POLICIES_UPDATED } from '../../content/shared';
import { currentSite } from '../../content/site';

const POLICIES = policiesFor(currentSite);

// /legal — booking terms, cancellation and refunds, stay rules, terms and
// privacy (src/content/shared.ts). Each section has an anchor, so the
// package page and messages can link straight to /legal#cancellation.
export function Legal() {
  return (
    <Section narrow className="space-y-12 py-24">
      <Seo
        title="Policies"
        description={`Booking, cancellation and refund terms, stay rules and privacy policy for ${currentSite.name}.`}
        path="/legal"
      />
      <div className="space-y-4 text-center">
        <h1 className="font-serif text-5xl font-medium">Policies</h1>
        <p className="text-stone text-sm tracking-widest uppercase">{currentSite.name}</p>
        <p className="text-stone text-xs">
          {groupInfo.legalName} · GSTIN {groupInfo.gstin} · Updated {POLICIES_UPDATED}
        </p>
      </div>

      <nav aria-label="On this page" className="flex flex-wrap justify-center gap-2">
        {POLICIES.map((p) => (
          <a
            key={p.id}
            href={`#${p.id}`}
            className="bg-forest/10 text-forest hover:bg-forest rounded-full px-4 py-2 text-[11px] font-semibold tracking-widest uppercase transition-colors hover:text-white"
          >
            {p.title}
          </a>
        ))}
      </nav>

      <div className="space-y-12">
        {POLICIES.map((policy) => (
          <Prose key={policy.id}>
            <h2 id={policy.id} className="scroll-mt-28">
              {policy.title}
            </h2>
            {policy.blocks.map((block, i) =>
              typeof block === 'string' ? (
                <p key={i}>{block}</p>
              ) : (
                <ul key={i}>
                  {block.list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ),
            )}
          </Prose>
        ))}
      </div>
    </Section>
  );
}
