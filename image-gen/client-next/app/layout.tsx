import './globals.css'

export const metadata = {
  title: 'Badge Generator',
  description: 'Generate custom badges with dynamic configuration',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}