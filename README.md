# Algo Day Trading Signals

## Overview
This project implements a **day trading signal generator** using real market data (Yahoo Finance via `yfinance`).

- Strategy: momentum + volatility + trend filters
- Goal: identify candidates with short-term 5-10% target bands
- API: `yfinance` (intraday quotes), with optional enhancement to Alpha Vantage/IEX

## Setup
1. Create & activate venv:
   - `python3 -m venv .venv`
   - `source .venv/bin/activate`
2. Install deps:
   - `pip install -r requirements.txt`
3. Run:
   - `python trade_signal.py`

## Signal Criteria
1. Intraday 5-min data
2. 5-period EMA crosses above 20 EMA
3. RSI(14) between 35-70 (trend with momentum)
4. ATR(14) to filter low volatility (min 0.7%)
5. Potential target: +6% from entry

## Next-level improvements
- Use real-time websocket feeds (Polygon/IEX)
- Apply model like LightGBM with engineered features
- Add backtesting (`backtrader` or `vectorbt`)
- Risk control (stop-loss, position sizing)
