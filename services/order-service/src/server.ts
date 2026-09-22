import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { OrderService } from './services/order.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const PORT = process.env.ORDER_SERVICE_PORT || '50052';
const USER_SERVICE_ADDRESS = `${process.env.USER_SERVICE_HOST || '127.0.0.1'}:${process.env.USER_SERVICE_PORT || '50051'}`;

export function startOrderService(): OrderService {
  console.log(`====================================================`);
  console.log(`🚀 [order-service] Initialized (Port: ${PORT})`);
  console.log(`🔗 Configured to connect to user-service at: ${USER_SERVICE_ADDRESS}`);
  console.log(`🔑 Outgoing gRPC Bearer Token: '${process.env.AUTH_DEMO_TOKEN || 'demo-token'}'`);
  console.log(`====================================================\n`);

  const orderService = new OrderService();

  const handleShutdown = (signal: string) => {
    console.log(`\n[order-service] 🛑 Received ${signal}. Closing gRPC client channel...`);
    orderService.getClient().close();
    console.log(`[order-service] ✅ Channel closed. Exiting.`);
    process.exit(0);
  };

  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));

  return orderService;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startOrderService();
  console.log(`[order-service] Running in idle mode. Run demo scripts in another terminal to initiate calls!`);
}
