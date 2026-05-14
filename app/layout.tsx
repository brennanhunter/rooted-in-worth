import type { Metadata } from "next";
import { IM_Fell_English, Raleway } from "next/font/google";
import Header from "./components/Header";
import Footer from "./components/Footer";
import NewsletterSignup from "./components/NewsletterSignup";
import "./globals.css";

const imFellEnglish = IM_Fell_English({
  variable: "--font-im-fell",
  weight: "400",
  subsets: ["latin"],
});

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rooted in Worth",
  description:
    "A small, self-sustaining community grounded in the conviction that every person carries inherent worth.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${imFellEnglish.variable} ${raleway.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream text-bark">
        <Header />
        <main className="flex-1">{children}</main>
        <NewsletterSignup />
        <Footer />
      </body>
    </html>
  );
}
