'use client';

import { useI18n } from '@/lib/i18n/i18n-context';
import { Container, PageHero } from '@/components/public/Section';
import { Reveal } from '@/components/public/Reveal';
import { PackageGrid } from '@/components/public/PackageGrid';
import { ActiveSubscriptions } from '@/components/public/ActiveSubscriptions';

// §10.1 — public pricing (wizard step 1). Data: GET /public/packages (PUB-01)
export default function PackagesPage() {
  const { t } = useI18n();

  return (
    <main>
      <PageHero eyebrow={t('packages.eyebrow')} title={t('packages.title')} lead={t('packages.subtitle')} />
      <section id="packages" className="py-24">
        <Container>
          <Reveal>
            <ActiveSubscriptions />
            <PackageGrid />
          </Reveal>
        </Container>
      </section>
    </main>
  );
}
