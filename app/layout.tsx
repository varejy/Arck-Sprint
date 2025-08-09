import type { Metadata } from "next";
import "./globals.css";
import { GameProvider } from "@/lib/game/GameContext";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Arca Sprint",
  description: "Simple mobile game built with Next.js",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  themeColor: "#0b1220",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Arca Sprint" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        <Script id="firebase-init" type="module" strategy="afterInteractive">{`
          import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js';
          import { getAnalytics } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-analytics.js';
          const firebaseConfig = {
            apiKey: 'AIzaSyA7_V5fqJvnEQwgTgttDA0AlPfinU-ECM8',
            authDomain: 'arck-sprint.firebaseapp.com',
            projectId: 'arck-sprint',
            storageBucket: 'arck-sprint.firebasestorage.app',
            messagingSenderId: '311125482111',
            appId: '1:311125482111:web:4bc76ebde363ce0934fd4a',
            measurementId: 'G-HHDS3YYRHX'
          };
          const app = initializeApp(firebaseConfig);
          getAnalytics(app);
        `}</Script>
        <GameProvider>{children}</GameProvider>
      </body>
    </html>
  );
}
