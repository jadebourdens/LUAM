// Inside /app/[locale]/about/page.tsx

// Make sure this import matches your folder structure:
import PageWrapper from '@/components/ui/PageWrapper'; 

export default function AboutPage() {
  return (
    <PageWrapper title="About Luam">
      <p>
        At Luam, we’re making shopping more sustainable and accessible...
      </p>
      <p>
        Tại Luam, chúng tôi đang nỗ lực làm cho việc mua sắm trở nên bền vững...
      </p>
    </PageWrapper>
  );
}