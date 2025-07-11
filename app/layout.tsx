'use client';

import './globals.css';
import { Inter } from 'next/font/google';
import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'react-hot-toast';
import Layout from '@/components/Layout';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#6366f1" />
        <link rel="manifest" href="/manifest.json" />
        <title>Loja de Bijuterias</title>
      </head>
      <body className={inter.className}>
        <SessionProvider>
          <Layout>
            {children}
          </Layout>
          <Toaster position="top-right" />
        </SessionProvider>
      </body>
    </html>
  );
}