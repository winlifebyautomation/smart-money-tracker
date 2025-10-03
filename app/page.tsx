import TradesList from '@/components/TradesList'
import Correlations from '@/components/Correlations'

export default function Home() {
  return (
    <main className="min-h-screen p-8 max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold">Smart Money Tracker</h1>
      <p className="mt-4 text-gray-600">Track where politicians and insiders invest</p>
      
      <Correlations />
      <TradesList />
    </main>
  )
}