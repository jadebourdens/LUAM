import ListingFormWrapper from './ListingFormWrapper';

export default async function NewListingPage({ 
  params 
}: { 
  params: Promise<{ locale: string }> 
}) {
  const { locale } = await params;

  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <ListingFormWrapper locale={locale} />
    </div>
  );
}
