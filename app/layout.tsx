import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "명동 길거리 음식 가이드",
  description:
    "명동의 인기 길거리 음식을 지도와 함께 한눈에. 떡볶이, 호떡, 계란빵부터 치즈 랍스터까지.",
  metadataBase: new URL("https://myeongdong-street-food.vercel.app"),
  openGraph: {
    title: "명동 길거리 음식 가이드",
    description: "명동의 인기 길거리 음식을 지도와 함께 한눈에.",
    type: "website",
    locale: "ko_KR",
  },
};

export const viewport: Viewport = {
  themeColor: "#ee2a5a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

const KAKAO_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-dvh antialiased">
        {KAKAO_KEY && (
          <Script
            strategy="beforeInteractive"
            src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&autoload=false`}
          />
        )}
        {children}
      </body>
    </html>
  );
}
