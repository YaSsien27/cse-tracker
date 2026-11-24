# CSE Tracker

Portfolio project. The owner is a beginner learning JavaScript: keep the code
simple, add short comments, and explain things in plain language.

## What the app does
- User adds Colombo Stock Exchange (CSE) shares they own (symbol, quantity, buy price, buy date).
- Fetches prices automatically on a schedule and saves them.
- Shows profit/loss and price-history charts on a dashboard.
- Alerts the user when a price goes above or below a target they set.

## Tech stack
- Backend: Node.js + Express, in /server
- Frontend: React with Vite, in /client
- Database: SQLite (better-sqlite3)
- Scheduled jobs: node-cron
- Charts: Recharts

## Data source
CSE has no official API, but its website uses JSON endpoints at https://www.cse.lk/api/
- POST companyInfoSummery (this spelling is intentional) with a "symbol" form field
- POST allSecurityCode for the symbol list

These are unofficial, so fetch responsibly: no more than every 15 minutes, and
save results in our own database.

## Rules for working together
- Build in phases. Only do the phase asked for, then stop.
- At the end of each phase, explain what was built file by file in simple terms,
  and say how to run and check it.
- Suggest a commit message in the style "feat: ..." / "fix: ..." / "chore: ...".
- Put secrets (passwords, tokens) in a .env file and make sure .env is in .gitignore.
