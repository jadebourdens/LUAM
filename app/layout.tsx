import type { ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';

export const metadata = {
  title: 'LUAM – Chợ hàng local Việt Nam',
  description: 'Mua bán hàng handmade, vintage và local brand Việt Nam. Nơi đam mê thành công việc thú vị.',
  keywords: 'handmade vietnam, local brand, chợ online, mua bán đồ handmade, vintage vietnam',
  openGraph: {
    title: 'LUAM – Chợ hàng local Việt Nam',
    description: 'Mua bán hàng handmade, vintage và local brand Việt Nam.',
    url: 'https://luam.shop',
    siteName: 'LUAM',
    locale: 'vi_VN',
    type: 'website',
  },
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <main>
            {children}
          </main>
          {/* Removed SiteFooter from here */}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}