import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist산스체 = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geist모노체 = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const 메타데이터: Metadata = {
  title: "Next 앱 만들기",
  description: "create next app으로 생성됨",
};

export default function 루트레이아웃({
  자식요소,
}: Readonly<{
  자식요소: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geist산스체.variable} ${geist모노체.variable} antialiased`}
      >
        {자식요소}
      </body>
    </html>
  );
}
