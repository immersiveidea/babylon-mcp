import 'newrelic';
import { BabylonMCPServer } from './server.js';

async function main() {
  try {
    const server = new BabylonMCPServer();
    await server.start();
  } catch (error) {
    console.error('Failed to start Babylon MCP Server:', error);
    process.exit(1);
  }
}

main();
