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

type InstitutionalTrade = {
  id: number
  investor_name: string
  investor_type: string
  stock_symbol: string
  company_name: string
  transaction_type: string
  shares_amount: number
  value_amount: number
  filing_date: string
  source: string
}

export default function TradesList() {
  const [congressTrades, setCongressTrades] = useState<Trade[]>([])
  const [institutionalTrades, setInstitutionalTrades] = useState<InstitutionalTrade[]>([])
  const [activeTab, setActiveTab] = useState<'congress' | 'institutional'>('congress')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAllTrades()
  }, [])

  async function fetchAllTrades() {
    try {
      // Fetch congressional trades
      const { data: congress, error: congressError } = await supabase
        .from('congressional_trades')
        .select('*')
        .order('transaction_date', { ascending: false })
        .limit(20)

      // Fetch institutional trades  
      const { data: institutional, error: instError } = await supabase
        .from('institutional_trades')
        .select('*')
        .order('filing_date', { ascending: false })
        .limit(20)

      if (congressError) throw congressError
      if (instError) throw instError
      
      setCongressTrades(congress || [])
      setInstitutionalTrades(institutional || [])
    } catch (error) {
      console.error('Error fetching trades:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="mt-8">Loading trades...</div>

  return (
    <div className="mt-8">
      {/* Tab Navigation */}
      <div className="flex space-x-4 border-b">
        <button
          onClick={() => setActiveTab('congress')}
          className={`pb-2 px-1 ${
            activeTab === 'congress'
              ? 'border-b-2 border-blue-500 font-semibold'
              : 'text-gray-600'
          }`}
        >
          🏛️ Congressional Trades ({congressTrades.length})
        </button>
        <button
          onClick={() => setActiveTab('institutional')}
          className={`pb-2 px-1 ${
            activeTab === 'institutional'
              ? 'border-b-2 border-blue-500 font-semibold'
              : 'text-gray-600'
          }`}
        >
          🏦 Institutional Trades ({institutionalTrades.length})
        </button>
      </div>

      {/* Congress Trades */}
      {activeTab === 'congress' && (
        <div className="grid gap-4 mt-6">
          {congressTrades.map((trade) => (
            <div key={trade.id} className="border p-4 rounded-lg hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">
                    {trade.politician_name} ({trade.politician_party}-{trade.politician_state})
                  </h3>
                  <p className="text-gray-600">
                    {trade.transaction_type} - <span className="font-mono font-bold">{trade.stock_symbol}</span>
                    {trade.company_name && ` (${trade.company_name})`}
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
      )}

      {/* Institutional Trades */}
      {activeTab === 'institutional' && (
        <div className="grid gap-4 mt-6">
          {institutionalTrades.map((trade) => (
            <div key={trade.id} className="border p-4 rounded-lg hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">
                    {trade.investor_name}
                    <span className="ml-2 text-sm text-gray-500">({trade.investor_type})</span>
                  </h3>
                  <p className="text-gray-600">
                    <span className="font-mono font-bold">{trade.stock_symbol}</span>
                    {trade.company_name && ` - ${trade.company_name}`}
                  </p>
                  <p className="text-sm text-gray-500">
                    Shares: {trade.shares_amount?.toLocaleString() || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Value: ${trade.value_amount?.toLocaleString() || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Date: {new Date(trade.filing_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded text-sm font-semibold ${
                    trade.transaction_type === 'BUY' 
                      ? 'bg-green-100 text-green-800'
                      : trade.transaction_type === 'SELL'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {trade.transaction_type}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">{trade.source}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}