import { useEffect, useState } from 'react'
import { getPortfolio } from './api.js'
import AlertsCard from './components/AlertsCard.jsx'
import HoldingForm from './components/HoldingForm.jsx'
import HoldingsTable from './components/HoldingsTable.jsx'
import PriceChart from './components/PriceChart.jsx'
import SummaryCard from './components/SummaryCard.jsx'

const REFRESH_MS = 60 * 1000 // reload from our own server every minute

// The main component: loads the portfolio and shows each part of the dashboard
function App() {
  const [portfolio, setPortfolio] = useState(null) // null means "not loaded yet"
  const [error, setError] = useState('')
  const [chosenSymbol, setChosenSymbol] = useState('')

  const [addCount, setAddCount] = useState(0) // goes up when a holding is added

  // Load when the page opens, when a holding is added, and every minute
  useEffect(() => {
    let ignore = false // becomes true if a newer load has replaced this one

    async function load() {
      try {
        const data = await getPortfolio()
        if (ignore) return
        setPortfolio(data)
        setError('')
      } catch (error) {
        if (!ignore) setError(error.message)
      }
    }

    load()
    const timer = setInterval(load, REFRESH_MS)
    return () => {
      ignore = true
      clearInterval(timer) // stop the old timer
    }
  }, [addCount])

  const holdings = portfolio?.holdings ?? []
  // Each symbol once, even if it was bought several times
  const symbols = [...new Set(holdings.map((holding) => holding.symbol))]
  // Use the chosen symbol, or the first one if nothing is chosen
  const selectedSymbol = symbols.includes(chosenSymbol) ? chosenSymbol : symbols[0]
  const selectedHolding = holdings.find((holding) => holding.symbol === selectedSymbol)

  return (
    <main>
      <h1>CSE Tracker</h1>
      {error && <p className="error" role="alert">{error}</p>}
      {!portfolio && !error && <p className="note">Loading...</p>}

      {portfolio && (
        <>
          <SummaryCard total={portfolio.total} holdingCount={holdings.length} />
          <HoldingForm onAdded={() => setAddCount(addCount + 1)} />
          <HoldingsTable holdings={holdings} selectedSymbol={selectedSymbol} onSelect={setChosenSymbol} />

          {selectedSymbol && (
            <section className="card">
              <div className="chart-header">
                <h2>Price history: {selectedSymbol} (Rs.)</h2>
                <label>
                  Stock
                  <select value={selectedSymbol} onChange={(event) => setChosenSymbol(event.target.value)}>
                    {symbols.map((symbol) => <option key={symbol}>{symbol}</option>)}
                  </select>
                </label>
              </div>
              {/* A new key gives each symbol a fresh chart */}
              <PriceChart key={selectedSymbol} symbol={selectedSymbol} lastFetched={selectedHolding.price_fetched_at} />
            </section>
          )}

          <AlertsCard symbols={symbols} />
        </>
      )}
    </main>
  )
}

export default App
