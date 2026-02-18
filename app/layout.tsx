import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mystery Party - AI Murder Mystery Game',
  description: 'Create and play custom murder mystery games with your friends',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
