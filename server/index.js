// Load the secrets in .env first
import './env.js';
// Express helps us build a web server
import express from 'express';
import apiRoutes from './apiRoutes.js';
import { startPriceJob } from './priceJob.js';

const app = express();

// Use the PORT setting if there is one, otherwise 3001
const PORT = process.env.PORT || 3001;

// When someone visits the home page, send back a message
app.get('/', (req, res) => {
  res.send('Hello world from CSE Tracker!');
});

// Send every address starting with /api to apiRoutes.js
app.use('/api', apiRoutes);

// Start listening for requests
app.listen(PORT, (error) => {
  // For example, another program may already be using this port
  if (error) {
    console.error(`Could not start the server: ${error.message}`);
    process.exit(1);
  }
  console.log(`Server running at http://localhost:${PORT}`);

  // Start fetching prices on a schedule
  startPriceJob();
});
