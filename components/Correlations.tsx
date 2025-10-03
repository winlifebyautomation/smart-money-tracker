'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Correlation = {
  stock_symbol: string
  congress_count: number
  institutional_count: number
  total_value: number
  politicians: string[]
  institutions: string[]
  signal_strength: 'EXTREME' | 'HIGH' | 'MEDIUM'
}

export default function Correlations() {
  const [correlations, setCorrelations] = useState<Correlation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    findCorrelations()
  }, [])

  async function findCorrelations() {
    try {
      // Get recent congressional trades
      const { data: congress } = await supabase
        .from('congressional_trades')
        .select('*')
        .gte('transaction_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .eq('transaction_type', 'BUY')

      // Get recent institutional trades
      const { data: institutional } = await supabase
        .from('institutional_trades')
        .select('*')
        .gte('filing_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

      // Find overlapping stocks
      const stockMap = new Map<string, Correlation>()

      // Process congressional trades
      congress?.forEach(trade => {
        const symbol = trade.stock_symbol
        if (!stockMap.has(symbol)) {
          stockMap.set(symbol, {
            stock_symbol: symbol,
            congress_count: 0,
            institutional_count: 0,
            total_value: 0,
            politicians: [],
            institutions: [],
            signal_strength: 'MEDIUM'
          })
        }
        const data = stockMap.get(symbol)!
        data.congress_count++
        if (!data.politicians.includes(trade.politician_name)) {
          data.politicians.push(trade.politician_name)
        }
      })

      // Process institutional trades
      institutional?.forEach(trade => {
        const symbol = trade.stock_symbol
        if (!stockMap.has(symbol)) {
          stockMap.set(symbol, {
            stock_symbol: symbol,
            congress_count: 0,
            institutional_count: 0,
            total_value: 0,
            politicians: [],
            institutions: [],
            signal_strength: 'MEDIUM'
          })
        }
        const data = stockMap.get(symbol)!
        data.institutional_count++
        data.total_value += trade.value_amount || 0
        if (!data.institutions.includes(trade.investor_name)) {
          data.institutions.push(trade.investor_name)
        }
      })

      // Calculate signal strength
      const correlationArray = Array.from(stockMap.values())
        .filter(c => c.congress_count > 0 || c.institutional_count > 1)
        .map(c => {
          if (c.congress_count >= 2 && c.institutional_count >= 2) {
            c.signal_strength = 'EXTREME'
          } else if (c.congress_count >= 1 && c.institutional_count >= 1) {
            c.signal_strength = 'HIGH'
          } else {
            c.signal_strength = 'MEDIUM'
          }
          return c
        })
        .sort((a, b) => {
          const strengthOrder = { 'EXTREME': 3, 'HIGH': 2, 'MEDIUM': 1 }
          return strengthOrder[b.signal_strength] - strengthOrder[a.signal_strength]
        })

      setCorrelations(correlationArray)
    } catch (error) {
      console.error('Error finding correlations:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="mt-8">Analyzing patterns...</div>

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">🎯 Smart Money Correlations</h2>
      <p className="text-gray-600 mb-6">Stocks where BOTH Congress and Institutions are moving:</p>

      {correlations.length === 0 ? (
        <p className="text-gray-500">No strong correlations found in the last 30 days</p>
      ) : (
        <div className="grid gap-4">
          {correlations.map((correlation) => (
            <div 
              key={correlation.stock_symbol} 
              className={`border-2 p-4 rounded-lg ${
                correlation.signal_strength === 'EXTREME' 
                  ? 'border-red-500 bg-red-50' 
                  : correlation.signal_strength === 'HIGH'
                  ? 'border-yellow-500 bg-yellow-50'
                  : 'border-gray-300'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold font-mono">{correlation.stock_symbol}</h3>
                    <span className={`px-3 py-1 rounded text-sm font-bold ${
                      correlation.signal_strength === 'EXTREME'
                        ? 'bg-red-500 text-white'
                        : correlation.signal_strength === 'HIGH'
                        ? 'bg-yellow-500 text-white'
                        : 'bg-gray-500 text-white'
                    }`}>
                      {correlation.signal_strength} SIGNAL
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-700">🏛️ Congress ({correlation.congress_count})</p>
                      <p className="text-sm text-gray-600">
                        {correlation.politicians.slice(0, 3).join(', ')}
                        {correlation.politicians.length > 3 && ` +${correlation.politicians.length - 3} more`}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-semibold text-gray-700">🏦 Institutions ({correlation.institutional_count})</p>
                      <p className="text-sm text-gray-600">
                        {correlation.institutions.slice(0, 2).join(', ')}
                        {correlation.institutions.length > 2 && ` +${correlation.institutions.length - 2} more`}
                      </p>
                    </div>
                  </div>

                  {correlation.total_value > 0 && (
                    <p className="mt-2 text-sm font-semibold">
                      Total Institutional Value: ${(correlation.total_value / 1000000000).toFixed(2)}B
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}