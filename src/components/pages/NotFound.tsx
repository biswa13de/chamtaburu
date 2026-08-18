import { Section } from '../ui/Section';
import { Button } from '../ui/Button';

export function NotFound() {
  return (
    <Section narrow className="space-y-8 py-32 text-center">
      <p className="text-forest text-sm font-bold tracking-widest uppercase">404</p>
      <h1 className="font-serif text-4xl font-medium md:text-5xl">Page not found</h1>
      <p className="text-stone mx-auto max-w-md text-sm leading-relaxed">
        The page you&rsquo;re looking for doesn&rsquo;t exist, may have moved, or the link may be
        incorrect.
      </p>
      <div>
        <Button to="/" variant="primary">
          Back to Home
        </Button>
      </div>
    </Section>
  );
}
