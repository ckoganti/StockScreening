import pandas as pd
import yfinance as yf
from datetime import datetime, time
import pytz
from typing import List, Dict
import argparse

WATCHLIST = ["AAPL", "MSFT", "NVDA", "AMD", "TSLA", "QCOM", "INTC", "AMZN", "GOOGL", "SPY", "QQQ", "IWM", "DIA", "VTI"]
API_MINUTES = 5
INTRADAY_PERIOD = "7d"


def fetch_intraday(symbol, period=INTRADAY_PERIOD):
    df = yf.download(
        tickers=symbol,
        period=period,
        interval=f"{API_MINUTES}m",
        progress=False,
    )
    if df.empty:
        raise RuntimeError(f"No data for {symbol}")
    df.dropna(inplace=True)
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.droplevel(1)
    return df


def compute_indicators(df):
    df = df.copy()
    # EMA using pandas
    df['ema5'] = df['Close'].ewm(span=5, adjust=False).mean()
    df['ema20'] = df['Close'].ewm(span=20, adjust=False).mean()
    # RSI approximation
    delta = df['Close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss
    df['rsi'] = 100 - (100 / (1 + rs))
    # ATR
    tr = pd.concat([df['High'] - df['Low'], (df['High'] - df['Close'].shift(1)).abs(), (df['Low'] - df['Close'].shift(1)).abs()], axis=1).max(axis=1)
    df['atr'] = tr.rolling(window=14).mean()
    # MACD
    df['ema12'] = df['Close'].ewm(span=12, adjust=False).mean()
    df['ema26'] = df['Close'].ewm(span=26, adjust=False).mean()
    df['macd'] = df['ema12'] - df['ema26']
    df['macd_signal'] = df['macd'].ewm(span=9, adjust=False).mean()
    df['macd_hist'] = df['macd'] - df['macd_signal']
    df['macd_cross_up'] = (df['macd'] > df['macd_signal']) & (df['macd'].shift(1) <= df['macd_signal'].shift(1))
    # Volume indicators
    df['volume_avg'] = df['Volume'].rolling(window=20).mean()
    df['rel_volume'] = df['Volume'] / df['volume_avg']
    df['volume_spike'] = df['Volume'] > df['volume_avg'] * 1.5
    # Momentum: price movement
    df['price_change'] = (df['Close'] - df['Close'].shift(5)) / df['Close'].shift(5) * 100  # 5-period % change
    df['ema_cross_up'] = (df['ema5'] > df['ema20']) & (df['ema5'].shift(1) <= df['ema20'].shift(1))
    return df


def score_signal(row):
    score = 0
    if row.get('ema_cross_up', False):
        score += 2
    if row.get('macd_cross_up', False):
        score += 2
    rsi_val = row.get('rsi', 50)
    if 35 <= rsi_val <= 70:
        score += 1
    atr_val = row.get('atr', 0)
    close_val = row.get('Close', 0)
    if atr_val / close_val >= 0.006:
        score += 1
    if row.get('volume_spike', False):
        score += 1
    price_change = row.get('price_change', 0)
    if price_change > 1:  # Positive momentum
        score += 1
    return score


def analyze_symbol(symbol, period=INTRADAY_PERIOD):
    df = fetch_intraday(symbol, period)
    df = compute_indicators(df)

    candidate = df.tail(1).iloc[0].to_dict()
    signal_score = score_signal(candidate)
    avg_volume = df['Volume'].tail(20).mean()
    latest = {
        'symbol': symbol,
        'datetime': df.index[-1],
        'close': float(candidate['Close']),
        'ema5': float(candidate['ema5']),
        'ema20': float(candidate['ema20']),
        'rsi': float(candidate['rsi']),
        'atr': float(candidate['atr']),
        'macd': float(candidate['macd']),
        'macd_signal': float(candidate['macd_signal']),
        'rel_volume': float(candidate['rel_volume']),
        'price_change': float(candidate['price_change']),
        'avg_volume': float(avg_volume),
        'score': signal_score,
    }

    # Profit target band 5-10%
    entry = latest['close']
    latest['target_low'] = round(entry * 1.05, 4)
    latest['target_high'] = round(entry * 1.10, 4)
    latest['stop_loss'] = round(entry * 0.98, 4)
    
    # Risk/reward
    risk = entry - latest['stop_loss']
    reward = latest['target_high'] - entry
    rr_ratio = reward / risk if risk > 0 else 0
    latest['rr_ratio'] = round(rr_ratio, 2)
    
    # Risk management: position size (assume $10k portfolio, 1% risk)
    risk_per_trade = 100  # $100 risk
    position_size = risk_per_trade / risk if risk > 0 else 0
    latest['position_size'] = round(position_size, 2)
    latest['risk_amount'] = risk_per_trade

    latest['signal'] = 'HOLD'
    if signal_score >= 2 and rr_ratio >= 2:
        latest['signal'] = 'BUY'
    elif signal_score <= 1:
        latest['signal'] = 'NO_GO'

    return latest


def scan_watchlist(symbols, period=INTRADAY_PERIOD):
    results = []
    for s in symbols:
        try:
            r = analyze_symbol(s, period)
            # Universe filter: volume > 1M
            if r['avg_volume'] > 1000000:
                results.append(r)
        except Exception as e:
            print(f"{s} analysis error: {e}")
    df = pd.DataFrame(results)
    if not df.empty:
        # Rank by score + volatility (ATR)
        df['rank_score'] = df['score'] + (df['atr'] / df['close']) * 100  # Weighted
        df.sort_values(by='rank_score', ascending=False, inplace=True)
        # Daily watchlist: top 10
        df = df.head(10)
    return df


def backtest_strategy(symbol: str, start_date: str, end_date: str) -> Dict:
    """
    Backtest the strategy on historical data.
    Returns a dict with performance metrics.
    """
    df = yf.download(tickers=symbol, start=start_date, end=end_date, interval="5m", progress=False)
    if df.empty:
        return {"error": f"No data for {symbol}"}
    df.dropna(inplace=True)
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.droplevel(1)
    
    df = compute_indicators(df)
    
    # Simulate trades
    capital = 10000  # Starting capital
    position = 0
    trades = []
    entry_price = 0
    
    for idx, row in df.iterrows():
        signal_score = score_signal(row)
        price = row['Close']
        
        if position == 0 and signal_score >= 2:  # Buy
            position = capital / price  # Buy as many as possible
            entry_price = price
            capital = 0
            trades.append({"type": "BUY", "price": price, "datetime": idx})
        elif position > 0 and (signal_score <= 1 or price <= entry_price * 0.98 or price >= entry_price * 1.10):  # Sell on signal, stop loss, or take profit
            capital = position * price
            position = 0
            trades.append({"type": "SELL", "price": price, "datetime": idx, "pnl": capital - 10000})
    
    final_value = capital if position == 0 else position * df.iloc[-1]['Close']
    total_pnl = final_value - 10000
    win_trades = len([t for t in trades if t.get("pnl", 0) > 0])
    total_trades = len(trades) // 2  # Pairs of buy/sell
    
    return {
        "symbol": symbol,
        "total_pnl": total_pnl,
        "win_rate": win_trades / max(total_trades, 1),
        "total_trades": total_trades,
        "final_value": final_value
    }


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Algo Day Trade Signal Scanner")
    parser.add_argument('--filter-volume', action='store_true', help="Filter stocks with volume > 1M")
    parser.add_argument('--min-rr', type=float, default=2.0, help="Minimum risk-reward ratio")
    parser.add_argument('--top-n', type=int, default=10, help="Number of top stocks in watchlist")
    parser.add_argument('--backtest', action='store_true', help="Run backtest")
    parser.add_argument('--backtest-symbol', type=str, default='AAPL', help="Symbol for backtest")
    parser.add_argument('--backtest-start', type=str, default='2026-02-01', help="Backtest start date")
    parser.add_argument('--backtest-end', type=str, default='2026-03-01', help="Backtest end date")
    args = parser.parse_args()

    print("Algo Day Trade Signal Scan -", datetime.now())
    
    # Check market hours
    eastern = pytz.timezone('US/Eastern')
    now = datetime.now(eastern)
    market_open = time(9, 30)
    market_close = time(16, 0)
    is_market_open = market_open <= now.time() <= market_close and now.weekday() < 5  # Mon-Fri
    
    if is_market_open:
        print("Market is open - using latest data.")
        period = "1d"
    else:
        print("Market is closed - using historical data.")
        period = INTRADAY_PERIOD
    
    result_df = scan_watchlist(WATCHLIST, period)
    
    # Apply filters
    if args.filter_volume:
        result_df = result_df[result_df['avg_volume'] > 1000000]
    result_df = result_df[result_df['rr_ratio'] >= args.min_rr]
    result_df = result_df.head(args.top_n)
    
    pd.set_option('display.max_columns', None)
    print(result_df.to_string(index=False))

    buy_candidates = result_df[result_df['signal'] == 'BUY']
    if not buy_candidates.empty:
        print("\nBuy candidates:")
        print(buy_candidates[['symbol', 'close', 'rsi', 'atr', 'target_low', 'target_high', 'rr_ratio']].to_string(index=False))
        # Alert
        print("\nALERT: Strong buy signals detected!")
    else:
        print("\nNo strong buy candidate right now.")

    print("\nImportant: does NOT replace trading advice. Do risk management.")
    
    if args.backtest:
        print(f"\nBacktesting {args.backtest_symbol} from {args.backtest_start} to {args.backtest_end}:")
        backtest_result = backtest_strategy(args.backtest_symbol, args.backtest_start, args.backtest_end)
        print(backtest_result)
