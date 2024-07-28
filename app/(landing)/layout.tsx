import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import SideBar from "@/components/SideBar";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Richard Beattie",
  description:
    "Richard is a 22 year old EECS student at MIT. He is interested in robotics, consumer hardware, and software engineering.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className}`}>
        <div className="flex h-screen flex-col lg:flex-row p-4 lg:p-0 lg:overflow-hidden">
          <div className="lg:basis-1/3 lg:relative">
            <SideBar />
          </div>
          <div className="lg:basis-2/3 lg:overflow-auto">{children}</div>
        </div>
      </body>
      <Analytics />
    </html>
  );
}
