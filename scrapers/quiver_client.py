import os
import json
import requests
from datetime import datetime, timedelta
from dotenv import load_dotenv
from supabase import create_client

load_dotenv('../.env.local')

class QuiverClient:
    def __init__(self, api_key=None):
        self.api_key = api_key or os.getenv('QUIVER_API_KEY')
        self.base_url = "https://api.quiverquant.com/beta"
        self.supabase = create_client(
            os.getenv('NEXT_PUBLIC_SUPABASE_URL'),
            os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
        )
        
        # Use mock data if no API key
        self.use_mock = not bool(self.api_key)
        if self.use_mock:
            print("⚠️ Using MOCK data - add QUIVER_API_KEY to .env.local for real data")
    
    def get_congress_trades(self):
        """Get recent congressional trades"""
        if self.use_mock:
            return self._mock_congress_trades()
        
        headers = {"Authorization": f"Bearer {self.api_key}"}
        response = requests.get(f"{self.base_url}/congress/trades", headers=headers)
        return response.json()
    
    def get_government_contracts(self):
        """Get recent government contracts"""
        if self.use_mock:
            return self._mock_contracts()
            
        headers = {"Authorization": f"Bearer {self.api_key}"}
        response = requests.get(f"{self.base_url}/government/contracts", headers=headers)
        return response.json()
    
    def get_lobbying_data(self):
        """Get lobbying expenditures"""
        if self.use_mock:
            return self._mock_lobbying()
            
        headers = {"Authorization": f"Bearer {self.api_key}"}
        response = requests.get(f"{self.base_url}/lobbying", headers=headers)
        return response.json()
    
    def _mock_congress_trades(self):
        """Mock data that matches QuiverQuant structure"""
        return [
            {
                "Representative": "Nancy Pelosi",
                "Transaction": "Purchase",
                "Ticker": "NVDA",
                "Amount": "$1M - $5M",
                "Date": "2024-12-15",
                "Party": "Democrat",
                "State": "CA"
            },
            {
                "Representative": "Dan Crenshaw", 
                "Transaction": "Sale",
                "Ticker": "AAPL",
                "Amount": "$50K - $100K",
                "Date": "2024-12-10",
                "Party": "Republican",
                "State": "TX"
            }
        ]
    
    def _mock_contracts(self):
        """Mock government contracts data"""
        return [
            {
                "Company": "Microsoft Corporation",
                "Amount": 10000000000,
                "Agency": "Department of Defense",
                "Date": "2024-12-01",
                "Description": "JEDI Cloud Computing Contract"
            },
            {
                "Company": "Palantir Technologies",
                "Amount": 500000000,
                "Agency": "CIA",
                "Date": "2024-12-05",
                "Description": "Data Analytics Platform"
            }
        ]
    
    def _mock_lobbying(self):
        """Mock lobbying data"""
        return [
            {
                "Company": "Meta Platforms",
                "Amount": 5000000,
                "Date": "2024-Q3",
                "Issue": "AI Regulation"
            },
            {
                "Company": "Google",
                "Amount": 7000000,
                "Date": "2024-Q3",
                "Issue": "Antitrust Legislation"
            }
        ]
    
    def find_correlations(self):
        """AI-powered correlation finder"""
        congress = self.get_congress_trades()
        contracts = self.get_government_contracts()
        lobbying = self.get_lobbying_data()
        
        correlations = []
        
        # Find congress trades before contract awards
        for trade in congress:
            for contract in contracts:
                # Simple correlation: same company, trade before contract
                if self._companies_match(trade.get('Ticker'), contract.get('Company')):
                    trade_date = datetime.fromisoformat(trade['Date'])
                    contract_date = datetime.fromisoformat(contract['Date'])
                    
                    if trade_date < contract_date and (contract_date - trade_date).days < 60:
                        correlations.append({
                            'alert_type': 'CONGRESS_CONTRACT_CORRELATION',
                            'politician': trade['Representative'],
                            'stock': trade['Ticker'],
                            'contract_value': contract['Amount'],
                            'days_before_award': (contract_date - trade_date).days,
                            'confidence': 'HIGH'
                        })
        
        return correlations
    
    def _companies_match(self, ticker, company_name):
        """Match ticker to company name"""
        ticker_map = {
            'MSFT': 'Microsoft',
            'NVDA': 'NVIDIA',
            'PLTR': 'Palantir',
            'META': 'Meta',
            'GOOGL': 'Google',
            'AAPL': 'Apple'
        }
        
        if ticker in ticker_map:
            return ticker_map[ticker].lower() in company_name.lower()
        return False
    
    def sync_to_database(self):
        """Sync all data to Supabase"""
        print("Syncing QuiverQuant data to database...")
        
        # Sync congress trades
        trades = self.get_congress_trades()
        for trade in trades:
            formatted_trade = {
                'politician_name': trade['Representative'],
                'politician_party': trade.get('Party', 'Unknown'),
                'politician_state': trade.get('State', 'Unknown'),
                'stock_symbol': trade['Ticker'],
                'transaction_type': 'BUY' if 'Purchase' in trade['Transaction'] else 'SELL',
                'amount_range': trade['Amount'],
                'transaction_date': trade['Date']
            }
            
            # Upsert to avoid duplicates
            self.supabase.table('congressional_trades').upsert(
                formatted_trade, 
                on_conflict='politician_name,stock_symbol,transaction_date'
            ).execute()
        
        print(f"✅ Synced {len(trades)} congressional trades")
        
        # Find and save correlations
        correlations = self.find_correlations()
        if correlations:
            print(f"🎯 Found {len(correlations)} correlations!")
            for correlation in correlations:
                print(f"  - {correlation['politician']} bought {correlation['stock']} "
                      f"{correlation['days_before_award']} days before ${correlation['contract_value']:,} contract")
        
        return {
            'trades_synced': len(trades),
            'correlations_found': len(correlations)
        }

if __name__ == "__main__":
    print("=" * 50)
    print("QUIVERQUANT DATA PIPELINE")
    print("=" * 50)
    
    client = QuiverClient()  # Will use mock data without API key
    
    # Test each endpoint
    print("\n📊 Congressional Trades:")
    trades = client.get_congress_trades()
    for trade in trades[:3]:
        print(f"  - {trade['Representative']}: {trade['Transaction']} {trade['Ticker']}")
    
    print("\n💰 Government Contracts:")
    contracts = client.get_government_contracts()
    for contract in contracts[:3]:
        print(f"  - {contract['Company']}: ${contract['Amount']:,}")
    
    print("\n🎯 Finding Correlations...")
    correlations = client.find_correlations()
    
    print("\n✅ Syncing to database...")
    result = client.sync_to_database()
    
    print("\nPipeline complete!")