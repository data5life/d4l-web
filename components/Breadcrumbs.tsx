'use client';

import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { Fragment } from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface BreadcrumbsProps {
  // Replace a path segment with a label: { 'whoqol': 'WHO Quality of Life' }
  labelMap?: Record<string, string>;
  // Segments to skip entirely: ['program', 'questionnaire', 'submission']
  skipSegments?: string[];
}

export default function Breadcrumbs({ labelMap = {} }: BreadcrumbsProps) {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  const t = useTranslations('common');

  const locale = useLocale();
  const skipSegments = [locale, 'program', 'questionnaire', 'submission'];

  // Build crumbs, skipping static connector segments
  const crumbs = [];
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    if (skipSegments.includes(segment)) continue;

    // Priority: labelMap (dynamic titles) → translations → fallback to segment
    const label = labelMap[segment] ?? (t.has(segment) ? t(segment) : segment.replace(/-/g, ' '));

    crumbs.push({
      label,
      href: '/' + segments.slice(0, i + 1).join('/'),
    });
  }

  return (
    <nav aria-label="Breadcrumb" data-testid="breadcrumbs" className="px-8 py-3 text-sm">
      <Breadcrumb>
        <BreadcrumbList>
          {crumbs.map((crumb, i) => (
            <Fragment key={crumb.href}>
              {i > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {i === crumbs.length - 1 ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href}>{crumb.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </nav>
  );
}
