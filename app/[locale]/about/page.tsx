// Inside /app/[locale]/about/page.tsx
import PageWrapper from '@/components/ui/PageWrapper';

export default async function AboutPage({ params }: { params: Promise<{ locale: 'en' | 'vi' }> }) {
  const { locale } = await params;
  const isVi = locale === 'vi';

  return (
    <PageWrapper title={isVi ? "Về Luam" : "About Luam"}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=DM+Sans:wght@300;400;500&display=swap');

        :root {
          --cream: #FBF7F2;
          --warm-white: #FFFDF9;
          --sand: #E8DDD0;
          --terracotta: #C4673A;
          --terracotta-light: #D4845A;
          --terracotta-pale: #F5EDE6;
          --bark: #6B4C35;
          --ink: #1C1510;
          --muted: #7A6A5E;
          --rule: #DDD0C4;
        }

        .la {
          font-family: 'DM Sans', sans-serif;
          font-weight: 300;
          color: var(--ink);
          background: var(--cream);
        }

        /* ─── continuous thread line ─── */
        .la__thread {
          position: fixed;
          left: 32px;
          top: 0;
          bottom: 0;
          width: 1px;
          background: linear-gradient(to bottom, transparent 0%, var(--rule) 8%, var(--rule) 92%, transparent 100%);
          pointer-events: none;
          z-index: 0;
        }

        @media (max-width: 768px) { .la__thread { display: none; } }

        /* ─── HERO ─── */
        .la-hero {
          position: relative;
          padding: 52px 0 44px;
          background: var(--warm-white);
          overflow: hidden;
        }

        .la-hero__grain {
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.025'/%3E%3C/svg%3E");
          pointer-events: none;
          opacity: 0.4;
        }

        .la-hero__accent {
          position: absolute;
          top: -60px; right: -80px;
          width: 420px; height: 420px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(196,103,58,0.10) 0%, transparent 70%);
          pointer-events: none;
        }

        .la-hero__inner {
          max-width: 880px;
          margin: 0 auto;
          padding: 0 64px 0 80px;
          position: relative;
        }

        .la-hero__tag {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--terracotta);
          margin-bottom: 18px;
        }

        .la-hero__tag-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: var(--terracotta);
        }

        .la-hero__h1 {
          font-family: 'Playfair Display', serif;
          font-size: clamp(48px, 7.5vw, 80px);
          font-weight: 900;
          line-height: 1.0;
          letter-spacing: -0.02em;
          color: var(--ink);
          margin: 0 0 22px;
        }

        .la-hero__h1 em {
          font-style: italic;
          font-weight: 700;
          color: var(--terracotta);
        }

        .la-hero__sub {
          max-width: 480px;
          font-size: 16px;
          font-weight: 400;
          line-height: 1.7;
          color: var(--muted);
        }

        .la-hero__rule {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-top: 30px;
        }

        .la-hero__rule-line {
          width: 48px; height: 1.5px;
          background: var(--terracotta);
          border-radius: 2px;
        }

        .la-hero__rule-text {
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--muted);
        }

        /* ─── MARQUEE STRIP ─── */
        .la-strip {
          background: var(--terracotta);
          padding: 11px 0;
          overflow: hidden;
          white-space: nowrap;
        }

        .la-strip__track {
          display: inline-flex;
          gap: 0;
          animation: marquee 22s linear infinite;
        }

        .la-strip__item {
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.9);
          padding: 0 32px;
        }

        .la-strip__sep {
          color: rgba(255,255,255,0.4);
          padding: 0 8px;
        }

        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }

        /* ─── STORY ─── */
        .la-story {
          max-width: 880px;
          margin: 0 auto;
          padding: 52px 64px 52px 80px;
          display: grid;
          grid-template-columns: 5fr 4fr;
          gap: 52px;
          align-items: start;
        }

        .la-section-label {
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--terracotta);
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .la-section-label::before {
          content: '';
          display: block;
          width: 16px; height: 1.5px;
          background: var(--terracotta);
          border-radius: 2px;
          flex-shrink: 0;
        }

        .la-story__h2 {
          font-family: 'Playfair Display', serif;
          font-size: clamp(26px, 3.5vw, 34px);
          font-weight: 700;
          line-height: 1.25;
          color: var(--ink);
          margin: 0 0 18px;
        }

        .la-story__h2 em {
          font-style: italic;
          font-weight: 400;
          color: var(--terracotta);
        }

        .la-story__body {
          font-size: 15px;
          line-height: 1.78;
          color: #4A3F36;
          font-weight: 400;
        }

        .la-story__body p + p { margin-top: 12px; }

        .la-story__right { padding-top: 4px; }

        .la-pull {
          font-family: 'Playfair Display', serif;
          font-size: 21px;
          font-weight: 400;
          font-style: italic;
          line-height: 1.6;
          color: var(--ink);
          position: relative;
          padding: 22px 0 22px 22px;
          margin-bottom: 22px;
        }

        .la-pull::before {
          content: '';
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 3px;
          background: linear-gradient(to bottom, var(--terracotta), var(--terracotta-light));
          border-radius: 2px;
        }

        /* ─── DIVIDER ─── */
        .la-divider {
          max-width: 880px;
          margin: 0 auto;
          padding: 0 80px;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .la-divider__line { flex: 1; height: 1px; background: var(--rule); }
        .la-divider__mark {
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          font-style: italic;
          color: var(--sand);
        }

        /* ─── VALUES ─── */
        .la-values {
          background: var(--ink);
          padding: 52px 0;
          position: relative;
          overflow: hidden;
        }

        .la-values__glow {
          position: absolute;
          top: -100px; left: 50%;
          transform: translateX(-50%);
          width: 600px; height: 300px;
          border-radius: 50%;
          background: radial-gradient(ellipse, rgba(196,103,58,0.18) 0%, transparent 70%);
          pointer-events: none;
        }

        .la-values__inner {
          max-width: 880px;
          margin: 0 auto;
          padding: 0 64px 0 80px;
          position: relative;
        }

        .la-values__head {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin-bottom: 32px;
        }

        .la-values__tag {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--terracotta-light);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .la-values__tag::before {
          content: '';
          display: block;
          width: 16px; height: 1.5px;
          background: var(--terracotta-light);
          border-radius: 2px;
        }

        .la-values__h2 {
          font-family: 'Playfair Display', serif;
          font-size: 28px;
          font-weight: 700;
          color: #F5EDE6;
          margin: 0;
        }

        .la-values__grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          overflow: hidden;
        }

        .la-val {
          background: rgba(255,255,255,0.03);
          padding: 28px 24px 30px;
          transition: background 0.25s;
        }

        .la-val:hover { background: rgba(196,103,58,0.10); }

        .la-val__n {
          font-family: 'Playfair Display', serif;
          font-size: 38px;
          font-weight: 400;
          font-style: italic;
          color: rgba(196,103,58,0.35);
          line-height: 1;
          margin-bottom: 14px;
        }

        .la-val__title {
          font-size: 11.5px;
          font-weight: 500;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #F5EDE6;
          margin-bottom: 10px;
        }

        .la-val__body {
          font-size: 13.5px;
          line-height: 1.72;
          color: rgba(245,237,230,0.65);
          font-weight: 300;
        }

        /* ─── CLOSING ─── */
        .la-closing {
          max-width: 880px;
          margin: 0 auto;
          padding: 52px 64px 52px 80px;
          display: grid;
          grid-template-columns: 120px 1fr;
          gap: 48px;
          align-items: center;
        }

        .la-closing__sigil {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .la-closing__ring {
          width: 52px; height: 52px;
          border: 1.5px solid var(--terracotta);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Playfair Display', serif;
          font-size: 20px;
          font-style: italic;
          color: var(--terracotta);
        }

        .la-closing__vline { width: 1px; height: 36px; background: var(--rule); }

        .la-closing__loc {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--muted);
          text-align: center;
        }

        .la-closing__text {
          font-family: 'Playfair Display', serif;
          font-size: clamp(22px, 3vw, 30px);
          font-weight: 700;
          line-height: 1.45;
          color: var(--ink);
        }

        .la-closing__text em {
          font-style: italic;
          font-weight: 400;
          color: var(--terracotta);
        }

        .la-cta {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          margin-top: 24px;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--ink);
          text-decoration: none;
          padding-bottom: 3px;
          border-bottom: 1.5px solid var(--terracotta);
          transition: color 0.2s, gap 0.2s;
        }

        .la-cta:hover { color: var(--terracotta); gap: 14px; }
        .la-cta::after { content: '→'; font-size: 13px; font-weight: 300; }

        /* ─── RESPONSIVE ─── */
        @media (max-width: 768px) {
          .la-hero__inner,
          .la-story,
          .la-values__inner,
          .la-closing,
          .la-divider { padding-left: 24px; padding-right: 24px; }
          .la-story { grid-template-columns: 1fr; gap: 28px; padding-top: 36px; padding-bottom: 36px; }
          .la-values__grid { grid-template-columns: 1fr; }
          .la-values__head { flex-direction: column; gap: 6px; }
          .la-closing { grid-template-columns: 1fr; gap: 24px; padding-top: 36px; padding-bottom: 44px; }
          .la-closing__sigil { flex-direction: row; }
          .la-closing__vline { width: 36px; height: 1px; }
        }
      `}</style>

      <div className="la">
        <div className="la__thread" aria-hidden />

        {/* ── Hero ── */}
        <section className="la-hero">
          <div className="la-hero__grain" aria-hidden />
          <div className="la-hero__accent" aria-hidden />
          <div className="la-hero__inner">
            <p className="la-hero__tag">
              <span className="la-hero__tag-dot" />
              {isVi ? "Câu chuyện của chúng tôi" : "Our story"}
            </p>
            <h1 className="la-hero__h1">
              {isVi ? (
                <>Nơi tài năng<br /><em>gặp gỡ</em> thế giới.</>
              ) : (
                <>Where craft<br />finds its <em>people.</em></>
              )}
            </h1>
            <p className="la-hero__sub">
              {isVi
                ? "Luam ra đời từ niềm tin rằng mỗi sản phẩm thủ công đều mang trong mình một câu chuyện — về người tạo ra nó, về mảnh đất Việt Nam."
                : "Luam was born from the belief that every handcrafted object holds a story — about the hands that made it, the land it came from, and the spirit that makes it irreplaceable."}
            </p>
            <div className="la-hero__rule">
              <div className="la-hero__rule-line" />
              <span className="la-hero__rule-text">{isVi ? "Khám phá" : "Scroll to explore"}</span>
            </div>
          </div>
        </section>

        {/* ── Marquee strip ── */}
        <div className="la-strip" aria-hidden>
          {[0,1].map(i => (
            <span key={i} className="la-strip__track">
              {(isVi
                ? ["Thủ công Việt Nam", "Chính hãng", "Cộng đồng", "Tâm huyết", "Sáng tạo", "Di sản"]
                : ["Vietnamese Craft", "Authentic", "Community", "Intentional", "Creative", "Legacy"]
              ).map((w, j) => (
                <span key={j} className="la-strip__item">
                  {w}<span className="la-strip__sep">·</span>
                </span>
              ))}
            </span>
          ))}
        </div>

        {/* ── Story ── */}
        <section className="la-story">
          <div>
            <p className="la-section-label">{isVi ? "Sứ mệnh" : "Mission"}</p>
            <h2 className="la-story__h2">
              {isVi ? (
                <>Kết nối nghệ nhân với<br /><em>những người trân trọng</em></>
              ) : (
                <>Connecting makers with<br /><em>those who care</em></>
              )}
            </h2>
            <div className="la-story__body">
              {isVi ? (
                <>
                  <p>Tại Luam, chúng tôi kết nối các nghệ sĩ và doanh nghiệp khởi nghiệp với những người mua trân trọng sự sáng tạo và tính nguyên bản.</p>
                  <p>Sứ mệnh của chúng tôi là tạo ra một không gian nơi mỗi giao dịch đều là sự ủng hộ thiết thực cho các thương hiệu địa phương Việt Nam.</p>
                </>
              ) : (
                <>
                  <p>At Luam, we connect artists and startups with buyers who value creativity and authenticity. Every product on our platform represents a maker who has poured intention into their craft.</p>
                  <p>Our mission is to build a bridge where every purchase serves as a meaningful step toward supporting and uplifting local Vietnamese brands.</p>
                </>
              )}
            </div>
          </div>

          <div className="la-story__right">
            <blockquote className="la-pull">
              {isVi
                ? "\"Luam không chỉ là nơi mua sắm — đó là nơi tôn vinh tài năng Việt.\""
                : "\"Luam is more than a marketplace — it is a community celebrating Vietnamese craftsmanship.\""}
            </blockquote>
            <div className="la-story__body">
              {isVi ? (
                <>
                  <p>Chúng tôi tin vào giá trị của sự kết nối và những câu chuyện phía sau mỗi sản phẩm.</p>
                  <p>Khi bạn mua sắm tại đây, bạn không chỉ nhận được một sản phẩm — bạn trở thành một phần của câu chuyện đó.</p>
                </>
              ) : (
                <>
                  <p>We believe in the power of connection and the stories behind every creation. Each brand on Luam is carefully curated for quality, authenticity, and creative vision.</p>
                  <p>When you shop here, you are not just receiving a product — you become part of its story.</p>
                </>
              )}
            </div>
          </div>
        </section>

        {/* ── Divider ── */}
        <div className="la-divider" aria-hidden>
          <div className="la-divider__line" />
          <span className="la-divider__mark">✦</span>
          <div className="la-divider__line" />
        </div>

        {/* ── Values ── */}
        <section className="la-values">
          <div className="la-values__glow" aria-hidden />
          <div className="la-values__inner">
            <div className="la-values__head">
              <p className="la-values__tag">{isVi ? "Giá trị cốt lõi" : "What we stand for"}</p>
              <h2 className="la-values__h2">{isVi ? "Ba nguyên tắc" : "Three principles"}</h2>
            </div>
            <div className="la-values__grid">
              {[
                {
                  n: "01",
                  en: { title: "Authenticity", body: "We only work with makers who bring genuine craft and personal vision. No mass production. Every piece reflects a real person behind it." },
                  vi: { title: "Chân thực", body: "Chúng tôi chỉ hợp tác với những người thực sự đam mê thủ công. Không sản xuất đại trà. Mỗi sản phẩm là một câu chuyện thật." }
                },
                {
                  n: "02",
                  en: { title: "Community", body: "Luam is built on relationships — between makers and buyers, between tradition and modernity, between local pride and global reach." },
                  vi: { title: "Cộng đồng", body: "Luam được xây dựng trên các mối quan hệ — giữa nghệ nhân và người mua, giữa truyền thống và hiện đại, giữa bản sắc địa phương và tầm nhìn toàn cầu." }
                },
                {
                  n: "03",
                  en: { title: "Intention", body: "Every decision — from how we curate to how we communicate — is made with care. We believe thoughtfulness is a form of respect." },
                  vi: { title: "Có chủ đích", body: "Mọi quyết định — từ cách chúng tôi tuyển chọn đến cách giao tiếp — đều được thực hiện với sự cẩn thận. Sự chu đáo là một hình thức tôn trọng." }
                }
              ].map(v => (
                <div key={v.n} className="la-val">
                  <p className="la-val__n">{v.n}</p>
                  <p className="la-val__title">{isVi ? v.vi.title : v.en.title}</p>
                  <p className="la-val__body">{isVi ? v.vi.body : v.en.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Closing ── */}
        <section className="la-closing">
          <div className="la-closing__sigil">
            <div className="la-closing__ring">L</div>
            <div className="la-closing__vline" aria-hidden />
            <p className="la-closing__loc">Việt Nam</p>
          </div>
          <div>
            <p className="la-closing__text">
              {isVi
                ? <>Đây là nơi <em>câu chuyện</em> gặp gỡ thương mại —<br />và nơi thương mại trở thành <em>di sản.</em></>
                : <>This is where <em>story</em> meets commerce —<br />and where commerce becomes <em>legacy.</em></>}
            </p>
            <a className="la-cta" href={`/${locale}`}>
              {isVi ? "Khám phá cửa hàng" : "Explore the marketplace"}
            </a>
          </div>
        </section>

      </div>
    </PageWrapper>
  );
}