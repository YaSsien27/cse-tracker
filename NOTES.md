# CSE Tracker

A personal dashboard for tracking shares on the Colombo Stock Exchange (CSE).

It lets me record the shares I own, fetches prices automatically, shows my
profit/loss and price-history charts, and sends a Telegram message when a price
reaches a target.

Built with Node.js + Express (`/server`), React + Vite (`/client`), and SQLite.

CSE has no official API, so prices come from the unofficial endpoints used by
its website. The scheduled job fetches once every 5 minutes, 9:30-14:30 Colombo
time, Monday to Friday. Prices are also fetched when the server starts, when a share
is added, and about 15 seconds after the computer wakes if a round was missed.

## How to run it

Built and tested with Node.js 22.14.

Install the packages (first time only):

```powershell
cd server
npm install
cd ../client
npm install
```

Then, from the main folder, use two terminals.

Terminal 1, the server (http://localhost:3001):

```powershell
cd server
npm run dev
```

Terminal 2, the dashboard (http://localhost:5173):

```powershell
cd client
npm run dev
```

If you see `EADDRINUSE`, the server is already running in another terminal.

### Checks

Run these in `/server`. They don't touch real data or contact CSE or Telegram:

```powershell
npm run check-db
npm run check-job
npm run check-alerts
```

Run these in `/client`:

```powershell
npm run lint
npm run build
```

To fetch one real price (contacts CSE, so use it sparingly), run this in `/server`:

```powershell
node fetchPrice.js JKH.N0000
```

## How to set up the Telegram bot

1. In Telegram, message **@BotFather** and send `/newbot`. Choose a name and a
   username ending in `bot`. Copy the token it gives you.
2. In `/server`, copy the template: `Copy-Item .env.example .env`
3. Put the token in `.env` as `TELEGRAM_BOT_TOKEN`. Never put it in `.env.example`.
4. Open your bot in Telegram, press **Start** and send it any message.
5. Run `npm run setup-telegram` and copy your chat ID into `.env` as `TELEGRAM_CHAT_ID`.
6. Run `npm run setup-telegram` again. A test message should arrive.
7. Restart the server, because it only reads `.env` when it starts.

If a token is ever exposed, send `/revoke` to @BotFather to replace it.

## Hardest parts

(First draft from what came up while building. Edit this in your own words.)

- **Unofficial API:** there are no documents, so the code is based on real replies.
  An unknown symbol returns status 404 with an empty `{}`.
- **Never crashing:** one failed price must not stop the other symbols or the server.
- **Schedule:** running only in market hours, in Colombo time, whatever the computer's timezone.
- **Sleep:** node-cron skips a round if the computer was asleep, so the job catches up
  once after waking.
- **Alerts firing once:** an alert is marked as triggered only after its message is sent,
  so a failed message is tried again.
- **Missing prices:** a share without a price shows a dash and is left out of the total,
  otherwise it would look like a total loss.
- **Secrets:** keeping the token in `.env` and out of `.env.example`.
- **Ports:** 3000 was used by another project, and 3001 by a second copy of this server.

## Later

Known problems:

- Prices and alerts stop while the computer sleeps. Prices from that time can't be recovered.
- If Wi-Fi takes over 15 seconds to return after sleep, the catch-up fetch fails, and the
  next round may be skipped too.
- Quick price spikes between two fetches are missed.
- A share edited to a new symbol, or an alert for a share I don't own, waits for the next
  scheduled fetch.
- Wrong symbols are accepted if they look right. They show as an error in the server log.
- The job doesn't know about Poya days and other holidays, so it may save old prices.
- Restarting the server doesn't fetch saved prices again within 5 minutes, but a symbol
  that failed is tried again. Running `fetchPrice.js` by hand isn't limited at all.
- If Telegram gets a message but its reply is lost, the alert may be sent twice.
- The API has no login, so other devices on the network may be able to reach it.
- Broker fees and taxes are not included in profit/loss.

Ideas:

- Choose symbols from a list, using CSE's `allSecurityCode` endpoint.
- Choose the chart's date range, and hide the overnight lines.
- Automated tests for `portfolio.js`.
- Split up the client build, because Recharts makes it large.
- Host it somewhere so it runs when my computer is off.
