import BadgeEditor from '@/components/BadgeEditor'

export default function Home() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Badge Generator</h1>
      </header>
      <BadgeEditor />
    </div>
  )
}