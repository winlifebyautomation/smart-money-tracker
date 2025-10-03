'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Contract = {
  id: number
  company_name: string
  contract_amount: number
  agency: string
  award_date: string
  description: string
  contract_id: string
  state: string
}

type ContractCorrelation = {
  contract: Contract
  trades: Array<{
    politician_name: string
    transaction_type: string
    transaction_date: string
    stock_symbol: string
  }>
}

export default function FederalContracts() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [correlations, setCorrelations] = useState<ContractCorrelation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchContractsAndCorrelations()
  }, [])

  async function fetchContractsAndCorrelations() {
    try {
      // Fetch federal contracts
      const { data: contractData } = await supabase
        .from('federal_contracts')
        .select('*')
        .order('contract_amount', { ascending: false })
        .limit(10)

      setContracts(contractData || [])

      // Fetch congressional trades to find correlations
      const { data: trades } = await supabase
        .from('congressional_trades')
        .select('*')
        .in('stock_symbol', ['MSFT', 'PLTR', 'NVDA', 'AMZN', 'LMT', 'BA', 'NOC', 'GD'])

      // Map companies to stock symbols
      const companyToSymbol: { [key: string]: string } = {
        'microsoft': 'MSFT',
        'palantir': 'PLTR',
        'amazon': 'AMZN',
        'nvidia': 'NVDA',
        'lockheed': 'LMT',
        'boeing': 'BA',
        'northrop': 'NOC'
      }

      // Find correlations
      const correlationMap = new Map<string, ContractCorrelation>()
      
      contractData?.forEach(contract => {
        const companyLower = contract.company_name.toLowerCase()
        let symbol = ''
        
        // Find matching symbol
        for (const [key, sym] of Object.entries(companyToSymbol)) {
          if (companyLower.includes(key)) {
            symbol = sym
            break
          }
        }

        if (symbol) {
          // Find trades for this symbol
          const relatedTrades = trades?.filter(t => t.stock_symbol === symbol) || []
          
          if (relatedTrades.length > 0) {
            correlationMap.set(contract.id.toString(), {
              contract,
              trades: relatedTrades
            })
          }
        }
      })

      setCorrelations(Array.from(correlationMap.values()))
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="mt-8">Loading federal contracts...</div>

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">💰 Federal Contracts</h2>
      
      {/* Show correlations first - these are the HOT ones */}
      {correlations.length > 0 && (
        <div className="mb-8 p-4 bg-red-50 border-2 border-red-500 rounded-lg">
          <h3 className="text-lg font-bold text-red-700 mb-3">
            🚨 Contract-Trade Correlations Found!
          </h3>
          {correlations.map(({ contract, trades }) => (
            <div key={contract.id} className="mb-4 p-3 bg-white rounded">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold">{contract.company_name}</p>
                  <p className="text-sm text-gray-600">
                    ${(contract.contract_amount / 1000000).toFixed(1)}M from {contract.agency}
                  </p>
                  <p className="text-xs text-gray-500">
                    Award Date: {new Date(contract.award_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-red-600">Politicians traded:</p>
                  {trades.slice(0, 2).map((trade, idx) => (
                    <p key={idx} className="text-xs">
                      {trade.politician_name} ({trade.transaction_type})
                    </p>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* All contracts list */}
      <div className="grid gap-4">
        <h3 className="font-semibold text-gray-700">Recent Major Contracts</h3>
        {contracts.map(contract => (
          <div key={contract.id} className="border p-4 rounded-lg hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-bold text-lg">{contract.company_name}</h4>
                <p className="text-green-600 font-bold text-xl">
                  ${(contract.contract_amount / 1000000000).toFixed(2)}B
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-semibold">Agency:</span> {contract.agency}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {contract.description}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Awarded: {new Date(contract.award_date).toLocaleDateString()}
                  {contract.state && ` • ${contract.state}`}
                </p>
              </div>
              <div className="ml-4">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                  {contract.contract_id}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}