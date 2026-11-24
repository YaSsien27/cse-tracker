// Talks to the CSE website. Used by fetchPrice.js and priceJob.js.

const API_URL = 'https://www.cse.lk/api/companyInfoSummery'; // this spelling is intentional
const TIMEOUT_MS = 15000; // give up after 15 seconds

// Asks the CSE website about one symbol.
// Returns the share's details, or throws an Error with a clear message.
export async function fetchPrice(symbol) {
  let response;
  let bodyText;

  // Step 1: send the request. This fails if there is no internet, for example.
  try {
    response = await fetch(API_URL, {
      method: 'POST',
      body: new URLSearchParams({ symbol }), // sends "symbol" as a form field
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    bodyText = await response.text();
  } catch (error) {
    if (error.name === 'TimeoutError') {
      throw new Error('The CSE website took too long to reply. Please try again later.');
    }
    // error.cause usually holds the real reason, e.g. ENOTFOUND
    const reason = error.cause?.code || error.message;
    throw new Error(`Could not reach the CSE website. Check your internet connection. (${reason})`);
  }

  // Step 2: for an unknown symbol, CSE replies with status 404 and an empty object
  if (response.status === 404 && bodyText.trim() === '{}') {
    throw new Error(`Symbol "${symbol}" was not found. Check the spelling, e.g. JKH.N0000`);
  }

  // Step 3: any other bad status means a problem at the website
  if (!response.ok) {
    throw new Error(`The CSE website returned an error (HTTP ${response.status}). Please try again later.`);
  }

  // Step 4: turn the text into a JavaScript object
  let data;
  try {
    data = JSON.parse(bodyText);
  } catch {
    throw new Error('The CSE website sent a reply that is not valid JSON.');
  }

  // Step 5: make sure the reply really contains a price
  // ("?." avoids a crash if something is missing)
  const info = data?.reqSymbolInfo;
  if (typeof info?.lastTradedPrice !== 'number' || info.lastTradedPrice <= 0) {
    throw new Error(`The CSE website did not send a price for "${symbol}".`);
  }

  return { symbol: info.symbol, name: info.name, price: info.lastTradedPrice };
}
