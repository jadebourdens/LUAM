import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://luam.shop'

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/en/',
          '/vi/',
          '/en/listings/',
          '/vi/listings/',
          '/en/category/',
          '/vi/category/',
          '/en/sellers/',
          '/vi/sellers/',
        ],
        disallow: [
          '/admin/',
          '/dashboard/',
          '/messages/',
          '/favorites/',
          '/api/',
          '/auth/',
          '/*.json$',
          '/*?*sort=',
          '/*?*filter=',
          '/checkout/',
          '/account/',
        ],
        crawlDelay: 1,
      },
      {
        userAgent: 'GPTBot',
        disallow: '/',
      },
      {
        userAgent: 'CCBot',
        disallow: '/',
      },
      {
        userAgent: 'anthropic-ai',
        disallow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
