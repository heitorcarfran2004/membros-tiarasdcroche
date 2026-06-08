import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tiara's de Crochê — Área de Membros",
  description: "Acesse seus guias, cursos e módulos de crochê.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Tiara's de Crochê",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#e6447a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Captura o beforeinstallprompt o mais cedo possível (antes da hidratação),
// guardando o evento em window.__deferredInstallPrompt para o botão Instalar usar.
const installCapture = `
(function(){
  window.__deferredInstallPrompt = window.__deferredInstallPrompt || null;
  window.addEventListener('beforeinstallprompt', function(e){
    e.preventDefault();
    window.__deferredInstallPrompt = e;
  });
})();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} h-full antialiased`}>
      <head>
        {/* Meta legado: o Next só emite o "mobile-web-app-capable" novo. */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <script dangerouslySetInnerHTML={{ __html: installCapture }} />
      </head>
      <body className="min-h-full">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
