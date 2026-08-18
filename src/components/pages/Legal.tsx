import { Section } from '../ui/Section';
import { Prose } from '../ui/Prose';
import { groupInfo, legalPolicies } from '../../content/shared';
import { currentSite } from '../../content/site';

// Structure and status text now come from src/content/shared.ts; the
// drafted policy copy itself still needs a lawyer/CA review (§6 of the
// content model) so each section keeps its "pending" placeholder note
// rather than shipping invented legal text.
export function Legal() {
  return (
    <Section narrow className="space-y-16 py-24">
      <div className="space-y-4 text-center">
        <h1 className="font-serif text-5xl font-medium">Legal Policies</h1>
        <p className="text-stone text-sm tracking-widest uppercase">{currentSite.name}</p>
        <p className="text-stone/70 text-xs">{groupInfo.legalName}</p>
        <p className="text-stone/70 text-xs">GSTIN: {groupInfo.gstin}</p>
      </div>

      <div className="space-y-12">
        {legalPolicies.map((policy) => (
          <Prose key={policy.title}>
            <h2>{policy.title}</h2>
            <p>{policy.note}</p>
          </Prose>
        ))}
      </div>
    </Section>
  );
}
