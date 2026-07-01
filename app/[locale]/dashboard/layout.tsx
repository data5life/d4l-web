export default async function DashboardLayout({
  children,
  breadcrumb,
}: {
  children: React.ReactNode;
  breadcrumb: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-violet-50/30 to-purple-50/50">
      <div className="px-4 pt-16">{breadcrumb}</div>
      {children}
    </div>
  );
}
