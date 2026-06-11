import PageWrapper from '@/components/ui/PageWrapper'

export default async function HowItWorksPage({ params }: { params: Promise<{ locale: 'en' | 'vi' }> }) {
  const { locale } = await (params)
  const isVi = locale === 'vi'

  return (
    <PageWrapper title={isVi ? "Cách hoạt động" : "How it works"}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap');

        :root {
          --cream: #FBF7F2;
          --terracotta: #C4673A;
          --terracotta-light: #D4845A;
          --ink: #1C1510;
          --muted: #7A6A5E;
          --rule: #DDD0C4;
        }

        .hw {
          font-family: 'DM Sans', sans-serif;
          background: var(--cream);
          color: var(--ink);
          padding: 48px 0 80px;
        }

        .hw__inner {
          max-width: 1000px;
          margin: 0 auto;
          padding: 0 80px;
        }

        .hw__grid {
          display: flex;
          gap: 32px;
          align-items: flex-start;
        }

        .hw__section {
          flex: 1;
          min-width: 0;
        }

        .hw__divider {
          width: 1px;
          align-self: stretch;
          background: var(--rule);
          flex-shrink: 0;
        }

        .hw__tag {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--terracotta-light);
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 24px;
        }

        .hw__tag::before {
          content: '';
          display: block;
          width: 16px; height: 1.5px;
          background: var(--terracotta-light);
          border-radius: 2px;
        }

        .hw__h2 {
          font-family: 'Playfair Display', serif;
          font-size: 24px;
          font-weight: 700;
          color: var(--ink);
          margin-bottom: 24px;
        }

        .hw__steps {
          display: flex;
          flex-direction: column;
          gap: 0;
          border: 1px solid var(--rule);
          border-radius: 12px;
          overflow: hidden;
        }

        .hw__step {
          display: grid;
          grid-template-columns: 48px 1fr;
          gap: 16px;
          padding: 20px 24px;
          border-bottom: 1px solid var(--rule);
          background: rgba(255,255,255,0.6);
          transition: background 0.2s;
        }

        .hw__step:last-child { border-bottom: none; }
        .hw__step:hover { background: rgba(196,103,58,0.05); }

        .hw__step-n {
          font-family: 'Playfair Display', serif;
          font-size: 28px;
          font-weight: 400;
          font-style: italic;
          color: rgba(196,103,58,0.35);
          line-height: 1;
          padding-top: 4px;
        }

        .hw__step-title {
          font-size: 15px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--ink);
          margin-bottom: 6px;
        }

        .hw__step-body {
          font-size: 15px;
          line-height: 1.7;
          color: var(--muted);
          font-weight: 300;
        }

        @media (max-width: 768px) {
          .hw__inner { padding: 0 24px; }
          .hw__grid { flex-direction: column; }
          .hw__divider { width: 100%; height: 1px; }
          .hw__step { grid-template-columns: 40px 1fr; gap: 12px; padding: 16px; }
        }
      `}</style>

      <div className="hw">
        <div className="hw__inner">
          <div className="hw__grid">

            {/* Buyers */}
            <div className="hw__section">
              <p className="hw__tag">{isVi ? "Dành cho người mua" : "For buyers"}</p>
              <h2 className="hw__h2">{isVi ? "Mua sắm thật dễ dàng" : "Shopping made easy"}</h2>
              <div className="hw__steps">
                {[
                  {
                    n: "01",
                    en: { title: "Browse & Discover", body: "Explore unique local brands — from handmade jewellery to vintage finds. Filter by category, price, or condition." },
                    vi: { title: "Duyệt & Khám phá", body: "Khám phá các thương hiệu local độc đáo — từ trang sức thủ công đến đồ vintage. Lọc theo danh mục, giá, hoặc tình trạng." }
                  },
                  {
                    n: "02",
                    en: { title: "Buy Securely", body: "Pay online via card or bank transfer. Your payment is safe and your order is confirmed instantly." },
                    vi: { title: "Mua an toàn", body: "Thanh toán qua thẻ hoặc chuyển khoản ngân hàng. Thanh toán của bạn được bảo mật và đơn hàng được xác nhận ngay lập tức." }
                  },
                  {
                    n: "03",
                    en: { title: "Receive Your Order", body: "The seller ships directly to you. Track your order status in real time from your orders page." },
                    vi: { title: "Nhận hàng", body: "Người bán giao hàng trực tiếp đến bạn. Theo dõi trạng thái đơn hàng theo thời gian thực từ trang đơn hàng của bạn." }
                  },
                ].map(s => (
                  <div key={s.n} className="hw__step">
                    <p className="hw__step-n">{s.n}</p>
                    <div>
                      <p className="hw__step-title">{isVi ? s.vi.title : s.en.title}</p>
                      <p className="hw__step-body">{isVi ? s.vi.body : s.en.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="hw__divider" />

            {/* Sellers */}
            <div className="hw__section">
              <p className="hw__tag">{isVi ? "Dành cho người bán" : "For sellers"}</p>
              <h2 className="hw__h2">{isVi ? "Biến đam mê thành thu nhập" : "Turn your passion into income"}</h2>
              <div className="hw__steps">
                {[
                  {
                    n: "01",
                    en: { title: "List for Free", body: "Create your listing in minutes. Add photos, set your price, and publish. No listing fees." },
                    vi: { title: "Đăng bán miễn phí", body: "Tạo danh sách trong vài phút. Thêm ảnh, đặt giá và đăng. Không mất phí đăng bán." }
                  },
                  {
                    n: "02",
                    en: { title: "Get Notified", body: "When someone buys, you get an instant notification with all order details and buyer info." },
                    vi: { title: "Nhận thông báo", body: "Khi có người mua, bạn nhận được thông báo ngay lập tức với đầy đủ thông tin đơn hàng và người mua." }
                  },
                  {
                    n: "03",
                    en: { title: "Ship & Get Paid", body: "Pack and ship the item directly to the buyer. Once delivered, your earnings are transferred to you." },
                    vi: { title: "Giao hàng & nhận tiền", body: "Đóng gói và giao hàng trực tiếp cho người mua." }
                  },
                ].map(s => (
                  <div key={s.n} className="hw__step">
                    <p className="hw__step-n">{s.n}</p>
                    <div>
                      <p className="hw__step-title">{isVi ? s.vi.title : s.en.title}</p>
                      <p className="hw__step-body">{isVi ? s.vi.body : s.en.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
