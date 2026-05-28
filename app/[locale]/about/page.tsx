// Inside /app/[locale]/about/page.tsx
import PageWrapper from '@/components/ui/PageWrapper';

export default function AboutPage({ params: { locale } }: { params: { locale: 'en' | 'vi' } }) {
  const isVi = locale === 'vi';

  return (
    <PageWrapper title={isVi ? "Về Luam" : "About Luam"}>
      <p>
        {isVi 
          ? "Tại Luam, chúng tôi kết nối các nghệ sĩ và doanh nghiệp khởi nghiệp với những người mua trân trọng sự sáng tạo và tính nguyên bản. Sứ mệnh của chúng tôi là tạo ra một không gian nơi mỗi giao dịch đều là sự ủng hộ thiết thực cho các thương hiệu địa phương Việt Nam."
          : "At Luam, we connect artists and startups with buyers who value creativity and authenticity. Our mission is to build a bridge where every purchase serves as a meaningful step toward supporting and uplifting local Vietnamese brands."
        }
      </p>
      <p>
        {isVi 
          ? "Chúng tôi tin vào giá trị của sự kết nối và những câu chuyện phía sau mỗi sản phẩm. Luam không chỉ là một nền tảng mua sắm—đó là nơi tôn vinh tâm huyết và tài năng Việt."
          : "We believe in the power of connection and the stories behind every creation. Luam is more than just a marketplace—it is a community dedicated to celebrating Vietnamese craftsmanship and talent."
        }
      </p>
    </PageWrapper>
  );
}