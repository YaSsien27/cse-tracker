// Loads the secrets in server/.env so the code can read them from process.env.
import { fileURLToPath } from 'node:url';

try {
  process.loadEnvFile(fileURLToPath(new URL('./.env', import.meta.url)));
} catch (error) {
  // ENOENT means there is no .env file, which is fine: the app works without Telegram
  if (error.code !== 'ENOENT') {
    console.error(`Could not read the .env file: ${error.message}`);
  }
}
