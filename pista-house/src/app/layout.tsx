import type { Metadata, Viewport } from 'next';
import '@fontsource/cormorant-garamond/400.css';
import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/cormorant-garamond/600.css';
import '@fontsource/cormorant-garamond/400-italic.css';
import '@fontsource-variable/manrope';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pista House — The Feast of the Deccan',
  description:
    'Dum Ke Roat, biscuits, handmade cookies and gift hampers from Hyderabad. Lift the lid on the feast of the Deccan.',
};

export const viewport: Viewport = {
  themeColor: '#073D2B',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <noscript>
          <style>{`.loader{display:none!important}.chapter-inner{visibility:visible!important;opacity:1!important}`}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}
