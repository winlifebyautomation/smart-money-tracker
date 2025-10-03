import os
import yfinance as yf
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv('../.env.local')

# Supabase setup
url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

def scrape_institutional_holdings():
    """Scrape major institutional holdings"""
    print("Starting institutional investor scraper...")
    
    hot_stocks = ['NVDA', 'AAPL', 'MSFT', 'GOOGL', 'META', 'TSLA', 'AMZN']
    all_holdings = []
    
    for symbol in hot_stocks:
        print(f"Checking {symbol}...")
        try:
            ticker = yf.Ticker(symbol)
            inst_holders = ticker.institutional_holders
            
            if inst_holders is not None and not inst_holders.empty:
                for index, row in inst_holders.head(3).iterrows():
                    holding = {
                        'investor_name': row['Holder'],
                        'investor_type': 'INSTITUTIONAL',
                        'stock_symbol': symbol,
                        'company_name': ticker.info.get('longName', ''),
                        'transaction_type': 'HOLD',
                        'shares_amount': int(row['Shares']),
                        'value_amount': float(row['Value']),
                        'filing_date': row['Date Reported'].strftime('%Y-%m-%d'),
                        'source': '13F'
                    }
                    all_holdings.append(holding)
                    print(f"  - {row['Holder']}: {row['Shares']:,} shares")
        except Exception as e:
            print(f"Error with {symbol}: {e}")
            continue
    
    if all_holdings:
        result = supabase.table('institutional_trades').insert(all_holdings).execute()
        print(f"\nInserted {len(all_holdings)} institutional holdings")
    return all_holdings

if __name__ == "__main__":
    print("=" * 50)
    print("INSTITUTIONAL TRADES SCRAPER")
    print("=" * 50)
    scrape_institutional_holdings()
    print("\nScraping complete!")