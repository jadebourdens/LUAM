import PageWrapper from '@/components/ui/PageWrapper'

export default async function HelpPage({ params }: { params: Promise<{ locale: 'en' | 'vi' }> }) {
  const { locale } = await params
  const isVi = locale === 'vi'

  return (
    <PageWrapper title={isVi ? "Trung tâm trợ giúp" : "Help Centre"}>
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

        .hp {
          font-family: 'DM Sans', sans-serif;
          background: var(--cream);
          color: var(--ink);
          padding: 48px 0 80px;
        }

        .hp__inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 60px;
        }

        .hp__tag {
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

        .hp__tag::before {
          content: '';
          display: block;
          width: 16px; height: 1.5px;
          background: var(--terracotta-light);
          border-radius: 2px;
        }

        .hp__urgent {
          background: rgba(196,103,58,0.06);
          border: 1px solid rgba(196,103,58,0.25);
          border-radius: 12px;
          padding: 16px 24px;
          margin-bottom: 40px;
          font-size: 14px;
          color: var(--ink);
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .hp__urgent-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: var(--terracotta);
          flex-shrink: 0;
        }

        .hp__urgent a {
          color: var(--terracotta);
          font-weight: 500;
          text-decoration: none;
        }

        .hp__urgent a:hover { text-decoration: underline; }

        .hp__tables-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 52px;
        }

        .hp__h2 {
          font-family: 'Playfair Display', serif;
          font-size: 20px;
          font-weight: 700;
          color: var(--ink);
          margin-bottom: 20px;
        }

        .hp__table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          border: 1px solid var(--rule);
          border-radius: 12px;
          overflow: hidden;
        }

        .hp__table thead tr {
          background: rgba(196,103,58,0.07);
        }

        .hp__table th {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--terracotta-light);
          padding: 14px 20px;
          text-align: left;
          border-bottom: 1px solid var(--rule);
        }

        .hp__table td {
          font-size: 15px;
          padding: 18px 20px;
          vertical-align: top;
          border-bottom: 1px solid var(--rule);
          background: rgba(255,255,255,0.6);
          line-height: 1.65;
        }

        .hp__table tr:last-child td { border-bottom: none; }

        .hp__table td:first-child {
          font-weight: 500;
          color: var(--ink);
          width: 35%;
        }

        .hp__table td:last-child {
          color: var(--muted);
          font-weight: 300;
          width: 65%;
        }

        .hp__contact {
          background: rgba(196,103,58,0.06);
          border: 1px solid rgba(196,103,58,0.2);
          border-radius: 12px;
          padding: 28px 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }

        .hp__contact-text {
          font-size: 15px;
          color: var(--ink);
          font-weight: 400;
        }

        .hp__contact-text span {
          display: block;
          font-size: 13px;
          color: var(--muted);
          font-weight: 300;
          margin-top: 4px;
        }

        .hp__contact-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--terracotta);
          color: white;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 12px 24px;
          border-radius: 999px;
          text-decoration: none;
          white-space: nowrap;
          transition: background 0.2s;
        }

        .hp__contact-btn:hover { background: #b35c32; }

        .hp__divider {
          height: 1px;
          background: var(--rule);
          margin: 48px 0;
        }

        @media (max-width: 768px) {
          .hp__inner { padding: 0 24px; }
          .hp__tables-grid { grid-template-columns: 1fr; }
          .hp__contact { flex-direction: column; align-items: flex-start; }
          .hp__table td:first-child { width: auto; }
        }
      `}</style>

      <div className="hp">
        <div className="hp__inner">

          

          <div className="hp__tables-grid">

            {/* Buyers */}
            <div>
              <p className="hp__tag">{isVi ? "Dành cho người mua" : "For buyers"}</p>
              <table className="hp__table">
                <thead>
                  <tr>
                    <th>{isVi ? "Câu hỏi" : "Question"}</th>
                    <th>{isVi ? "Trả lời" : "Answer"}</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      en: { q: "How do I buy an item?", a: "Browse listings, click on an item you like, and hit 'Buy Now'. You'll be guided through a simple checkout process." },
                      vi: { q: "Làm thế nào để mua hàng?", a: "Duyệt các sản phẩm, nhấp vào mặt hàng bạn thích và nhấn 'Mua ngay'. Bạn sẽ được hướng dẫn qua quy trình thanh toán đơn giản." }
                    },
                    {
                      en: { q: "What payment methods are accepted?", a: "As a marketplace — for now we don't interfere the payment method. Direct bank transfer between buyers and sellers is available." },
                      vi: { q: "Những phương thức thanh toán nào được chấp nhận?", a: "Hiện tại chúng tôi không xử lý thanh toán — người mua thanh toán qua chuyển khoản. Các phương án thanh toán hiện đại khác sẽ được tích hợp trong tương lai." }
                    },
                    {
                      en: { q: "How do I track my order?", a: "Go to your Orders page — you'll see the status of each order and tracking info once the seller ships." },
                      vi: { q: "Làm thế nào để theo dõi đơn hàng?", a: "Vào trang Đơn hàng của bạn — bạn sẽ thấy trạng thái của từng đơn hàng và thông tin theo dõi khi người bán giao hàng." }
                    },
                    {
                      en: { q: "What if I have a problem with my order?", a: "Contact the seller directly via the message button on the listing or order page. If you can't resolve it, reach out to us." },
                      vi: { q: "Nếu tôi có vấn đề với đơn hàng thì sao?", a: "Liên hệ trực tiếp với người bán qua nút nhắn tin trên trang sản phẩm hoặc trang đơn hàng. Nếu không giải quyết được, hãy liên hệ với chúng tôi." }
                    },
                  ].map((item, i) => (
                    <tr key={i}>
                      <td>{isVi ? item.vi.q : item.en.q}</td>
                      <td>{isVi ? item.vi.a : item.en.a}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Sellers */}
            <div>
              <p className="hp__tag">{isVi ? "Dành cho người bán" : "For sellers"}</p>
              <table className="hp__table">
                <thead>
                  <tr>
                    <th>{isVi ? "Câu hỏi" : "Question"}</th>
                    <th>{isVi ? "Trả lời" : "Answer"}</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      en: { q: "How do I list an item?", a: "Click the '+ Sell' button in the top navigation. Fill in the details, add photos, set your price and publish." },
                      vi: { q: "Làm thế nào để đăng bán sản phẩm?", a: "Nhấp vào nút '+ Bán' ở thanh điều hướng trên cùng. Điền thông tin, thêm ảnh, đặt giá và đăng bán." }
                    },
                    {
                      en: { q: "How do I know when someone buys?", a: "You'll get a notification instantly. Go to your Orders page to see the buyer's details and shipping address." },
                      vi: { q: "Làm sao tôi biết khi có người mua?", a: "Bạn sẽ nhận được thông báo ngay lập tức. Vào trang Đơn hàng để xem thông tin người mua và địa chỉ giao hàng." }
                    },
                    {
                      en: { q: "How do I ship the item?", a: "Pack the item carefully and ship it to the buyer's address. Update the tracking number in your Orders page so the buyer can follow along." },
                      vi: { q: "Làm thế nào để giao hàng?", a: "Đóng gói sản phẩm cẩn thận và giao đến địa chỉ người mua. Cập nhật mã theo dõi trong trang Đơn hàng để người mua có thể theo dõi." }
                    },
                    
                    
                  ].map((item, i) => (
                    <tr key={i}>
                      <td>{isVi ? item.vi.q : item.en.q}</td>
                      <td>{isVi ? item.vi.a : item.en.a}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>

          {/* Contact */}
          <div className="hp__contact">
            <div className="hp__contact-text">
              {isVi ? "Vẫn cần trợ giúp?" : "Still need help?"}
              <span>{isVi ? "Chúng tôi luôn sẵn sàng hỗ trợ bạn." : "We're always happy to help."}</span>
            </div>
            <a href="mailto:jadebourdens@gmail.com" className="hp__contact-btn">
              {isVi ? "Liên hệ chúng tôi" : "Contact us"} →
            </a>
          </div>

        </div>
      </div>
    </PageWrapper>
  )
}