'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Trade = {
  id: number
  politician_name: string
  politician_party: string
  politician_state: string
  stock_symbol: string
  company_name: string
  transaction_type: string
  transaction_date: string
  amount_range: string
}

export default function TradesList() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTrades()
  }, [])

  async function fetchTrades() {
    try {
      const { data, error } = await supabase
        .from('congressional_trades')
        .select('*')
        .order('transaction_date', { ascending: false })

      if (error) throw error
      setTrades(data || [])
    } catch (error) {
      console.error('Error fetching trades:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading trades...</div>

  return (
    <div className="grid gap-4 mt-8">
      {trades.map((trade) => (
        <div key={trade.id} className="border p-4 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-lg">
                {trade.politician_name} ({trade.politician_party}-{trade.politician_state})
              </h3>
              <p className="text-gray-600">
                {trade.transaction_type} - {trade.stock_symbol} ({trade.company_name})
              </p>
              <p className="text-sm text-gray-500">
                Amount: {trade.amount_range}
              </p>
              <p className="text-sm text-gray-500">
                Date: {new Date(trade.transaction_date).toLocaleDateString()}
              </p>
            </div>
            <span className={`px-3 py-1 rounded text-sm font-semibold ${
              trade.transaction_type === 'BUY' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {trade.transaction_type}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}