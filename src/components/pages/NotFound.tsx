import { Section } from '../ui/Section';
import { Button } from '../ui/Button';
import { Seo } from '../ui/Seo';

// Not included in the sitemap (scripts/generate-seo.mjs only lists real
// routes) and marked `noindex` — a 404 page should never rank in search.
export function NotFound() {
  return (
    <Section narrow className="space-y-8 py-32 text-center">
      <Seo
        title="Page Not Found"
        description="The page you're looking for doesn't exist or may have moved."
        path="/404"
        noindex
      />
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
