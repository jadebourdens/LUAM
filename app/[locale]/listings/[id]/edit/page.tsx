import EditListingFormWrapper from './EditListingFormWrapper';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';

export default async function EditListingPage({ 
  params 
}: { 
  params: Promise<{ id: string, locale: string }> 
}) {
  const { id, locale } = await params;
  
  const supabase = await createClient();

  const { data: listing, error } = await supabase
    .from('listings')
    .select('*, category:categories(slug), images:listing_images(id, image_url, position)')
    .eq('id', id)
    .single();

  if (error || !listing) {
    return notFound();
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <EditListingFormWrapper locale={locale} initialData={listing} />
    </div>
  );
}
