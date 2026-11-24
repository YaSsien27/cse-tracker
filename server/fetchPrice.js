// Fetches the current price of one CSE share and prints it.
// How to run:  node fetchPrice.js JKH.N0000
import { fetchPrice } from './cseApi.js';

// Read the symbol typed after the file name, and tidy it up
const symbol = (process.argv[2] || '').trim().toUpperCase();

if (!symbol) {
  console.error('Please give a symbol. Example: node fetchPrice.js JKH.N0000');
  process.exitCode = 1; // 1 tells the terminal that something went wrong
} else {
  try {
    const share = await fetchPrice(symbol);
    console.log(`${share.name} (${share.symbol})`);
    console.log(`Last traded price: Rs. ${share.price.toFixed(2)}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  }
}
