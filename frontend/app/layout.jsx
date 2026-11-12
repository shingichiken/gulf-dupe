export const metadata = {
  title: 'GulfDupe | GCC Smart Saver',
  description: 'Find cheaper alternatives and dupes across UAE, Qatar, and Saudi Arabia.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body>{children}</body>
    </html>
  );
}
