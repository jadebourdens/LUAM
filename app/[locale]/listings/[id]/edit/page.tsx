import ListingForm from '@/components/listings/ListingForm';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';

// Update the type signature to reflect that params is a Promise
export default async function EditListingPage({ 
  params 
}: { 
  params: Promise<{ id: string, locale: string }> 
}) {
  // 1. Await the params to unwrap them
  const { id, locale } = await params;
  
  // 2. Await the client creation
  const supabase = await createClient();

  // 3. Use the unwrapped 'id'
  const { data: listing, error } = await supabase
    .from('listings')
    .select('*, category:categories(slug), images:listing_images(id, image_url, position)')
    .eq('id', id)
    .single();

  if (error || !listing) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <ListingForm locale={locale} initialData={listing} />
      </div>
    </div>
  );
}