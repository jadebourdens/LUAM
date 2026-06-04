import ListingForm from '@/components/listings/ListingForm';

export default async function NewListingPage({ 
  params 
}: { 
  params: Promise<{ locale: string }> 
}) {
  const { locale } = await params;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <ListingForm locale={locale} />
      </div>
    </div>
  );
}