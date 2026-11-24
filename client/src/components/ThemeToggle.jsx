import { useState } from 'react'
import { showToast } from '../toast.js'

// The switch between light and dark.
// The starting theme is chosen by the small script in index.html.
function ThemeToggle() {
  const [theme, setTheme] = useState(document.documentElement.dataset.theme)
  const isDark = theme === 'dark'

  function handleClick() {
    const newTheme = isDark ? 'light' : 'dark'
    setTheme(newTheme)
    document.documentElement.dataset.theme = newTheme // index.css changes the colours
    showToast('info', newTheme === 'dark' ? 'Dark mode on' : 'Light mode on')
    try {
      localStorage.setItem('theme', newTheme) // remember it for next time
    } catch {
      // Storage is blocked, so the choice lasts until the page is reloaded
    }
  }

  return (
    <button className="theme-toggle" type="button" role="switch" aria-checked={isDark} aria-label="Dark mode" onClick={handleClick}>
      {/* Sun */}
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="4.5" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" />
      </svg>
      {/* Moon */}
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z" />
      </svg>
      <span className="theme-knob" />
    </button>
  )
}

export default ThemeToggle
