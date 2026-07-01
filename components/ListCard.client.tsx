import { useTranslations } from 'next-intl';

interface ListCardProps {
  title: string;
  isLoading?: boolean;
  error?: string;
  isLast?: boolean;
  testId?: string;
  children?: React.ReactNode;
}

export default function ListCard({
  title,
  children,
  isLoading = false,
  testId,
  error,
}: ListCardProps) {
  const t = useTranslations('common');
  return (
    <div
      className="mb-6 rounded-3xl border border-white/50 bg-white/90 p-8 shadow-xl backdrop-blur-xl"
      data-testid={testId}
    >
      <h3 className="mb-4 text-xl font-semibold text-gray-900">{title}</h3>
      {isLoading ? (
        <div className="py-8 text-center text-gray-500">{t('loading')}</div>
      ) : error ? (
        <div className="py-8 text-center text-red-500">{error}</div>
      ) : (
        children
      )}
    </div>
  );
}
