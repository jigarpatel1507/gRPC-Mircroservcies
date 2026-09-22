import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { OrderService } from '../services/order-service/src/services/order.service.js';
import { OrderStreamResponse } from '../services/order-service/src/types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export async function runServerStreamingDemo() {
  console.log('================================================================');
  console.log('📌 DEMO 2: Server-to-Client / Server Streaming (GetUserOrders)');
  console.log('   Flow: Order Service (1 Request) -> User Service (Stream of Responses)');
  console.log('================================================================\n');

  const orderService = new OrderService();
  const targetUserId = 'user-1';

  console.log(`[Demo Client] 1️⃣ Requesting orders stream for userId='${targetUserId}'...`);
  console.log(`[Demo Client] ⏳ Listening for incoming stream chunks in real-time...\n`);

  const receivedOrders: OrderStreamResponse[] = [];
  let chunkNumber = 1;

  await new Promise<void>((resolve, reject) => {
    orderService.streamOrders(targetUserId, {
      onData: (order) => {
        console.log(`[Demo Client] 📦 Stream Chunk #${chunkNumber} arrived:`);
        console.log(`   - Order ID:  ${order.order_id}`);
        console.log(`   - Item Name: ${order.item_name}`);
        console.log(`   - Amount:    $${order.amount}`);
        console.log(`   - Status:    ${order.status}`);
        console.log(`   - Time:      ${order.timestamp}`);
        console.log(`   ---------------------------------------------`);
        receivedOrders.push(order);
        chunkNumber++;
      },
      onError: (err) => {
        console.error('[Demo Client] ❌ Stream Error:', err.message);
        reject(err);
      },
      onEnd: () => {
        console.log(`\n[Demo Client] 🏁 Server finished sending stream (EOF received).`);
        console.log(`[Demo Client] Total orders received: ${receivedOrders.length}`);
        resolve();
      },
    });
  });

  orderService.getClient().close();
  console.log('\n✨ Server Streaming RPC Demo Completed Successfully!\n');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runServerStreamingDemo();
}
