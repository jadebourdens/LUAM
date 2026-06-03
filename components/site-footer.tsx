'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

// Add here the paths you have already built
const BUILT_PAGES = ['/about', '/help'];

const translations: Record<string, {
  sections: { title: string; links: { name: string; href: string }[] }[]
  copyright: string
}> = {
  en: {
    sections: [
      {
        title: "Luam",
        links: [
          { name: "About us", href: "/about" },
          { name: "Sustainability", href: "/sustainability" },
          { name: "Accessibility", href: "/accessibility" },
        ],
      },
      {
        title: "Discover",
        links: [
          { name: "How it works", href: "/how-it-works" },
          { name: "Item Verification", href: "/item-verification" },
          { name: "Mobile apps", href: "/apps" },
          { name: "Infoboard", href: "/infoboard" },
        ],
      },
      {
        title: "Help",
        links: [
          { name: "Help Centre", href: "/help" },
          { name: "Selling", href: "/help/selling" },
          { name: "Buying", href: "/help/buying" },
          { name: "Trust and Safety", href: "/help/trust-and-safety" },
        ],
      },
    ],
    copyright: "All rights reserved.",
  },
  vi: {
    sections: [
      {
        title: "Luam",
        links: [
          { name: "Về chúng tôi", href: "/about" },
          { name: "Phát triển bền vững", href: "/sustainability" },
          { name: "Khả năng tiếp cận", href: "/accessibility" },
        ],
      },
      {
        title: "Khám phá",
        links: [
          { name: "Cách thức hoạt động", href: "/how-it-works" },
          { name: "Xác minh sản phẩm", href: "/item-verification" },
          { name: "Ứng dụng di động", href: "/apps" },
          { name: "Bảng thông tin", href: "/infoboard" },
        ],
      },
      {
        title: "Hỗ trợ",
        links: [
          { name: "Trung tâm trợ giúp", href: "/help" },
          { name: "Bán hàng", href: "/help/selling" },
          { name: "Mua hàng", href: "/help/buying" },
          { name: "Tin cậy & An toàn", href: "/help/trust-and-safety" },
        ],
      },
    ],
    copyright: "Đã đăng ký bản quyền.",
  },
}

export default function SiteFooter() {
  const pathname = usePathname()
  const locale = pathname.split('/')[1] || 'en'

  const t = translations[locale] ?? translations.en

  // Logic to determine if a link goes to a real page or coming-soon
  const getHref = (href: string) => {
    return BUILT_PAGES.includes(href) ? `/${locale}${href}` : `/${locale}/coming-soon`;
  };

  return (
    <footer className="bg-white border-t mt-12 py-12">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        {t.sections.map((section) => (
          <div key={section.title}>
            <h3 className="text-lg font-bold mb-4 tracking-tight">
              {section.title === "Luam" ? (
                <>
                  <span className="text-stone-900">lu</span>
                  <span className="text-[#FF5722]">a</span>
                  <span className="text-stone-900">m</span>
                </>
              ) : (
                section.title
              )}
            </h3>
            <ul className="space-y-2 text-stone-600">
              {section.links.map((link) => (
                <li key={link.name}>
                  <Link
                    href={getHref(link.href)}
                    className="hover:text-[#FF5722] transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="container mx-auto px-4 mt-8 pt-8 border-t text-sm text-stone-500">
        © 2026{' '}
        <span className="text-stone-900">lu</span>
        <span className="text-[#FF5722]">a</span>
        <span className="text-stone-900">m</span>
        {'. '}
        {t.copyright}
      </div>
    </footer>
  )
}