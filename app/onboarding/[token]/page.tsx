import { OnboardingWizard } from '../components/OnboardingWizard';

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <OnboardingWizard token={token} />
      </div>
    </main>
  );
}
