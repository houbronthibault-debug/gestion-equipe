import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { getParametresApparence } from "@/lib/parametresApparence";
import { assombrirCouleur } from "@/lib/couleurs";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gestion d'équipe",
  description: "Site de gestion d'équipe de club",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const parametres = await getParametresApparence();

  const htmlStyle = {
    ...(parametres?.couleurFormulaires && {
      "--accent-formulaires": parametres.couleurFormulaires,
      "--accent-formulaires-dark": assombrirCouleur(
        parametres.couleurFormulaires,
      ),
    }),
    ...(parametres?.couleurTableauBord && {
      "--accent-tableau-bord": parametres.couleurTableauBord,
    }),
    ...(parametres?.couleurFondFormulaires && {
      "--card-background-formulaires": parametres.couleurFondFormulaires,
    }),
    ...(parametres?.couleurFondTableauBord && {
      "--card-background-tableau-bord": parametres.couleurFondTableauBord,
    }),
    ...(parametres?.couleurFond && { "--background": parametres.couleurFond }),
  } as React.CSSProperties;

  const bodyStyle: React.CSSProperties = {};
  if (parametres?.couleurFond) {
    bodyStyle.backgroundColor = parametres.couleurFond;
  }
  if (parametres?.imageFond) {
    bodyStyle.backgroundImage = `url(${parametres.imageFond})`;
    bodyStyle.backgroundSize = "cover";
    bodyStyle.backgroundPosition = "center";
    bodyStyle.backgroundAttachment = "fixed";
  }

  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={htmlStyle}
    >
      <body className="min-h-full flex flex-col" style={bodyStyle}>
        {children}
      </body>
    </html>
  );
}
