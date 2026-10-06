require('dotenv').config();
const http = require('http');
const app = require('./app');
const { testConnection } = require('./config/db');
const { initSocket } = require('./socket');
const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
initSocket(server);

async function start() {
  try {
    await testConnection();
    server.listen(PORT, () => console.log(`[server] RoadRescue API & Socket.IO listening on http://localhost:${PORT}`));
  } catch (err) {
    console.error('[server] Failed to start:', err.message);
    process.exit(1);
  }
}
start();
