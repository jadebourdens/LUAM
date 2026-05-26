'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

export default function SiteFooter() {
  const pathname = usePathname()
  // Extracts 'vi', 'en', etc. from the URL (e.g., /vi/home -> 'vi')
  const locale = pathname.split('/')[1] || 'en'

  const sections = [
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
  ];

  return (
    <footer className="bg-white border-t mt-12 py-12">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        {sections.map((section) => (
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
                  {/* Now the link correctly points to /vi/about or /en/about */}
                  <Link 
                    href={`/${locale}${link.href}`} 
                    className="hover:text-stone-900 transition-colors"
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
        © 2026 <span className="text-stone-900">lu</span><span className="text-[#FF5722]">a</span><span className="text-stone-900">m</span>. All rights reserved.
      </div>
    </footer>
  );
}