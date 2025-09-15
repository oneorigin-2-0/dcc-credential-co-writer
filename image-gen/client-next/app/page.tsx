import BadgeEditor from '@/components/BadgeEditor'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-gray-800 px-4 py-4 text-white text-center shadow-md">
        <h1 className="text-xl font-semibold">Badge Generator</h1>
      </header>
      <BadgeEditor />
    </div>
  )
}