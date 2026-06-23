import type { ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import '../globals.css';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return { other: { lang: locale } };
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <head>
        {/* Google Tag Manager - As high as possible in <head> */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-54XFQDFH');`
          }}
        />

      {/* Google Analytics */}
      <script async src="https://www.googletagmanager.com/gtag/js?id=G-38Q1EG55BD" />
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-38Q1EG55BD');
          `
        }}
      />
      </head>
      <body>
        {/* Google Tag Manager (noscript) - Immediately after <body> */}
        <noscript>
          <iframe 
            src="https://www.googletagmanager.com/ns.html?id=GTM-54XFQDFH"
            height="0" width="0" style={{ display: 'none', visibility: 'hidden' }}
          ></iframe>
        </noscript>

        <NextIntlClientProvider messages={messages}>
          <SiteHeader />
          {children}
          <SiteFooter />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}