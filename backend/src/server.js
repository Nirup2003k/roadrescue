require('dotenv').config();
const app = require('./app');
const { testConnection } = require('./config/db');
const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await testConnection();
    app.listen(PORT, () => console.log(`[server] RoadRescue API listening on http://localhost:${PORT}`));
  } catch (err) {
    console.error('[server] Failed to start:', err.message);
    process.exit(1);
  }
}
start();
