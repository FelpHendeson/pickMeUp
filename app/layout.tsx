import type { Metadata, Viewport } from "next";
import { ConfirmDialogProvider, ToastProvider } from "./components/ui";
import "./globals.css";
import "./mobile.css";

export const metadata: Metadata = {
  title: "Ascensao dos Ecos",
  description: "RPG de torre, herois, reliquias e progresso de conta.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <ToastProvider>
          <ConfirmDialogProvider>{children}</ConfirmDialogProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
