import type { Metadata } from "next";
import { ConfirmDialogProvider } from "./components/ui";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ascensao dos Ecos",
  description: "RPG de torre, herois, reliquias e progresso de conta.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <ConfirmDialogProvider>{children}</ConfirmDialogProvider>
      </body>
    </html>
  );
}
