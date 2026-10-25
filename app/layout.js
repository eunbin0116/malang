export const metadata = {
  title: "말랑 | 사회생활 말투 도우미",
  description:
    "말은 부드럽게, 뜻은 정확하게. 상황에 맞는 말투와 쿠션어를 추천해요."
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body style={{ margin: 0 }}>
        {children}
      </body>
    </html>
  );
}
