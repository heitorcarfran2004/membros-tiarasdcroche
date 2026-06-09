import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
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
    icon: "/favicon.png",
    apple: "/apple-icon.png",
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
    <html lang="pt-BR" className={`${fredoka.variable} ${nunito.variable} h-full antialiased`} data-scroll-behavior="smooth">
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
