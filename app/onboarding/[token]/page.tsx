import { OnboardingWizard } from '../components/OnboardingWizard';

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // <main> + background are provided by app/onboarding/layout.tsx (site chrome).
  return (
    <div className="container mx-auto px-4 py-10 md:py-16 max-w-3xl">
      <OnboardingWizard token={token} />
    </div>
  );
}
