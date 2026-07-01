import { Suspense } from 'react';
import OnboardingForm from './components/OnboardingForm';

export default function OnboardingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-50 via-violet-50/30 to-purple-50/50 p-4">
      <Suspense>
        <OnboardingForm />
      </Suspense>
    </main>
  );
}
