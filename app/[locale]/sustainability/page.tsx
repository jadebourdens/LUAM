import PageWrapper from '@/components/ui/PageWrapper';

// Notice: params is a Promise
export default async function SustainabilityPage({ 
  params 
}: { 
  params: Promise<{ locale: string }>; 
}) {
  // You MUST await the params
  const { locale } = await params;

  return (
    <PageWrapper title="Sustainability at Luam">
      <p>Content for {locale} goes here...</p>
    </PageWrapper>
  );
}