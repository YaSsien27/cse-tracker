import { useEffect, useRef, useState } from 'react'
import { getPortfolio } from './api.js'
import AlertsCard from './components/AlertsCard.jsx'
import HoldingForm from './components/HoldingForm.jsx'
import HoldingsTable from './components/HoldingsTable.jsx'
import PriceChart from './components/PriceChart.jsx'
import SummaryCard from './components/SummaryCard.jsx'
import ThemeToggle from './components/ThemeToggle.jsx'
import Toaster from './components/Toaster.jsx'
import { dismissSticky, showToast } from './toast.js'

const REFRESH_MS = 60 * 1000 // reload from our own server every minute

// The main component: loads the portfolio and shows each part of the dashboard
function App() {
  const [portfolio, setPortfolio] = useState(null) // null means "not loaded yet"
  const isOffline = useRef(false) // remembers if the last load failed
  const [chosenSymbol, setChosenSymbol] = useState('')

  const [changeCount, setChangeCount] = useState(0) // goes up when a holding changes

  // Load when the page opens, when a holding changes, and every minute
  useEffect(() => {
    let ignore = false // becomes true if a newer load has replaced this one

    async function load() {
      try {
        const data = await getPortfolio()
        if (ignore) return
        setPortfolio(data)
        if (isOffline.current) {
          isOffline.current = false
          dismissSticky()
          showToast('success', 'Connected to the server again.')
        }
      } catch (error) {
        // Only show this once, not every minute while the server is off
        if (ignore || isOffline.current) return
        isOffline.current = true
        showToast('error', error.message, true) // true = stays until we reconnect
      }
    }

    load()
    const timer = setInterval(load, REFRESH_MS)
    return () => {
      ignore = true
      clearInterval(timer) // stop the old timer
    }
  }, [changeCount])

  function reload() {
    setChangeCount((count) => count + 1)
  }

  const holdings = portfolio?.holdings ?? []
  // Each symbol once, even if it was bought several times
  const symbols = [...new Set(holdings.map((holding) => holding.symbol))]
  // Use the chosen symbol, or the first one if nothing is chosen
  const selectedSymbol = symbols.includes(chosenSymbol) ? chosenSymbol : symbols[0]
  const selectedHolding = holdings.find((holding) => holding.symbol === selectedSymbol)

  function selectSymbol(symbol) {
    if (symbol === selectedSymbol) return // already showing
    setChosenSymbol(symbol)
    showToast('info', `Showing ${symbol}`)
  }

  return (
    <>
      <header className="top-bar">
        <div className="top-bar-inner">
          <svg className="logo" viewBox="0 0 32 32" aria-hidden="true">
            <path d="M4 23l8-8 6 5L28 8" pathLength="1" />
          </svg>
          <h1>CSE Tracker</h1>
          <ThemeToggle />
        </div>
      </header>

      <main>
        {/* Grey shapes shown while loading */}
        {!portfolio && (
          <div role="status" aria-label="Loading">
            <div className="skeleton" />
            <div className="skeleton tall" />
          </div>
        )}

        {portfolio && (
          <>
            <SummaryCard total={portfolio.total} holdingCount={holdings.length} />

            <div className="columns">
              <section className="card">
                <div className="chart-header">
                  <h2>Price history{selectedSymbol && `: ${selectedSymbol} (Rs.)`}</h2>
                  {selectedSymbol && (
                    <select aria-label="Stock" value={selectedSymbol} onChange={(event) => selectSymbol(event.target.value)}>
                      {symbols.map((symbol) => <option key={symbol}>{symbol}</option>)}
                    </select>
                  )}
                </div>
                {/* A new key gives each symbol a fresh chart */}
                {selectedSymbol ? (
                  <PriceChart key={selectedSymbol} symbol={selectedSymbol} lastFetched={selectedHolding.price_fetched_at} />
                ) : (
                  <p className="note">Add a holding to see its chart here.</p>
                )}
              </section>

              <section className="card">
                <h2>Add a holding</h2>
                <HoldingForm onSaved={reload} />
              </section>
            </div>

            <HoldingsTable holdings={holdings} selectedSymbol={selectedSymbol} onSelect={selectSymbol} onChanged={reload} />
            <AlertsCard symbols={symbols} />
          </>
        )}
      </main>

      <Toaster />
    </>
  )
}

export default App
