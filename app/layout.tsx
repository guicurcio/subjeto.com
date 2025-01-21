

import "./globals.css";
import type { Metadata } from "next";
import ClientLayout from "./ClientLayout";

import {
  athletics,
  geistMonoVF,
  geistVF,
  gelicaLt,
  moderat,
  neueMontreal,
  sourceSansPro,
  spaceGrotesk,
  visueltPro,
} from "./fonts";

export const metadata: Metadata = {
  
  metadataBase: new URL("https://subjeto.com"),

  
  title: {
    default: "subjeto",
    template: "%s | subjeto",
  },

  
  description:
    "subjeto delivers futuristic interfaces, powerful back-end solutions, and strategic digital products to accelerate your business into the future.",

  
  keywords: [
    "web development agency",
    "futuristic interfaces",
    "back-end solutions",
    "branding",
    "digital products",
    "marketing",
    "subjeto",
  ],

  
  authors: [{ name: "subjeto Team", url: "https://subjeto.com" }],

  
  openGraph: {
    type: "website",
    url: "https://subjeto.com",
    title: "subjeto – webcontainer, chat, and editor integration.",
    description:
      "subjeto – webcontainer, chat, and editor integration.",
    siteName: "subjeto",
    images: [
      {
        url: "https://subjeto.com/og-image.jpg",
        alt: "subjeto brand or preview image",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    site: "@subjeto",
    title: "subjeto – webcontainer, chat, and editor integration.",
    description:
      "Transform your business with pioneering interfaces and robust back-ends. Partner with subjeto to drive your digital success.",
    images: ["https://subjeto.com/twitter-image.jpg"],
  },

  
  robots: {
    index: true,
    follow: true,
  },

  
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },

  
  applicationName: "subjeto",
  generator: "Next.js",

  
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={[
        athletics.variable,
        geistMonoVF.variable,
        geistVF.variable,
        gelicaLt.variable,
        moderat.variable,
        neueMontreal.variable,
        sourceSansPro.variable,
        spaceGrotesk.variable,
        visueltPro.variable,
      ].join(" ")}
    >
      <meta httpEquiv="Cross-Origin-Opener-Policy" content="same-origin" />
      <meta httpEquiv="Cross-Origin-Embedder-Policy" content="require-corp" />
      <body className="overflow-hidden">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
