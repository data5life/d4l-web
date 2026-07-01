// TODO: Add a server side Rich Text Renderer for SEO
import { RichTextRenderer } from '@/components/RichTextRenderer';
import { SENSORHUB_BASE_PATH } from '@/lib/constants';
import { Locale } from '@/i18n/config';
import { Program } from '@/lib/programTypes';
import { getTranslations } from 'next-intl/server';
import CollapsibleSection from '@/components/CollapsibleSection.client';

interface Props {
  program: Program;
  lang: Locale;
  locale: Locale;
  collapsible?: boolean;
  action: React.ReactNode;
}

export default async function ProgramHeader({
  program,
  lang,
  locale,
  collapsible = false,
  action,
}: Props) {
  const t = await getTranslations({ locale, namespace: 'program' });
  const programLocale = {
    title: program.content.title[lang],
    description: program.content.description[lang],
    contact: program.content.contact[lang],
  };
  const imageBase = `${SENSORHUB_BASE_PATH}/static/programs/${program.name}/images`;

  const descriptionAndContact = (
    <div className="space-y-6">
      {program.content.institute?.image && (
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${imageBase}/${program.content.institute.image}`}
            alt={program.content.institute.name?.[lang] || ''}
            className="max-h-24 max-w-72 object-contain"
          />
        </div>
      )}

      {program.content.description && (
        <div>
          <h3 className="mb-3 text-sm font-semibold tracking-wider text-gray-700 uppercase">
            {t('description')}
          </h3>
          <RichTextRenderer content={programLocale.description} />
        </div>
      )}

      {program.content.contact && (
        <div>
          <h3 className="mb-3 text-sm font-semibold tracking-wider text-gray-700 uppercase">
            {t('contactInformation')}
          </h3>
          <RichTextRenderer content={programLocale.contact} />
        </div>
      )}

      {(program.content.contactInfo.email || program.content.contactInfo.phone) && (
        <div>
          <div className="space-y-2">
            {program.content.contactInfo.email && (
              <div className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 flex-shrink-0 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <a
                  href={`mailto:${program.content.contactInfo.email}`}
                  className="text-sm text-violet-600 hover:text-violet-700"
                >
                  {program.content.contactInfo.email}
                </a>
              </div>
            )}
            {program.content.contactInfo.phone && (
              <div className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 flex-shrink-0 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <a
                  href={`tel:${program.content.contactInfo.phone}`}
                  className="text-sm text-violet-600 hover:text-violet-700"
                >
                  {program.content.contactInfo.phone}
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {!program.content.description &&
        !program.content.contactInfo.email &&
        !program.content.contactInfo.phone &&
        !program.content.contact && (
          <p className="text-sm text-gray-500">{t('noAdditionalInfo')}</p>
        )}
    </div>
  );

  return (
    <div className="mb-6 rounded-3xl border border-white/50 bg-white/90 p-8 shadow-xl backdrop-blur-xl">
      <div className="mb-6 flex items-center gap-4">
        {program.content.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`${imageBase}/${program.content.image}`}
            alt=""
            className="h-16 w-16 rounded-2xl object-cover shadow-lg"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 shadow-lg">
            <svg
              className="h-8 w-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
        )}
        <div className="flex flex-1 items-center justify-between gap-4">
          <h1 className="mb-1 text-3xl font-bold text-gray-900">{programLocale.title}</h1>
          {action && <div>{action}</div>}
        </div>
      </div>

      <div>
        {collapsible ? (
          <CollapsibleSection label={t('descriptionAndContact')} contentClassName="mt-4">
            {descriptionAndContact}
          </CollapsibleSection>
        ) : (
          descriptionAndContact
        )}
      </div>
    </div>
  );
}
