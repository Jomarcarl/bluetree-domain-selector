import "./globals.css";

export const metadata = {
  title: "Domain Selector",
  description: "BlueTree internal domain selection tool",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
