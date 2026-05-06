import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Git-Aura — GitHub Stats Visualizer',
  description: 'Turn GitHub profiles into living 3D auras powered by React Three Fiber and GLSL.',
  metadataBase: new URL('https://git-aura.vercel.app'),
  openGraph: {
    title: 'Git-Aura',
    description: 'Generate a 3D aura from any public GitHub profile.',
    type: 'website',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
