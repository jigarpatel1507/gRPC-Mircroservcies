import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { OrderService } from '../services/order-service/src/services/order.service.js';
import { OrderLocationEvent } from '../services/order-service/src/types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export async function runBidiStreamingDemo() {
  console.log('================================================================');
  console.log('📌 DEMO 3: Bi-directional Streaming (TrackOrder)');
  console.log('   Flow: Order Service (Events Stream) <-> User Service (Updates Stream)');
  console.log('================================================================\n');

  const orderService = new OrderService();
  const orderId = 'ord-102';
  const courierId = 'courier-speedy-42';

  console.log(`[Demo Client] 🚀 Opening bi-directional stream for orderId='${orderId}'...\n`);

  await new Promise<void>((resolve, reject) => {
    // Open the bi-directional stream
    const duplexStream = orderService.createTrackingSession({
      onStatusUpdate: (status) => {
        console.log(`[Demo Client] 🛰️ << Server Status Received:`);
        console.log(`   - Status:   ${status.status}`);
        console.log(`   - ETA:      ${status.estimated_delivery}`);
        console.log(`   - Message:  ${status.message}`);
        console.log(`   ---------------------------------------------`);
      },
      onError: (err) => {
        console.error('[Demo Client] ❌ Duplex Stream Error:', err.message);
        reject(err);
      },
      onEnd: () => {
        console.log('[Demo Client] 🏁 Server closed duplex response stream.');
        resolve();
      },
    });

    // Simulated waypoint location updates sent by the courier client
    const locationEvents: OrderLocationEvent[] = [
      {
        order_id: orderId,
        courier_id: courierId,
        latitude: 37.7749,
        longitude: -122.4194,
        note: 'Courier picked up package from central distribution center',
      },
      {
        order_id: orderId,
        courier_id: courierId,
        latitude: 37.7833,
        longitude: -122.4167,
        note: 'Courier en route on Highway 101, light traffic',
      },
      {
        order_id: orderId,
        courier_id: courierId,
        latitude: 37.7915,
        longitude: -122.4089,
        note: 'Courier entered customer neighborhood',
      },
      {
        order_id: orderId,
        courier_id: courierId,
        latitude: 37.7952,
        longitude: -122.4028,
        note: 'Courier arrived at destination building',
      },
    ];

    // Send events sequentially with a delay to showcase asynchronous bi-directional traffic
    let index = 0;
    const interval = setInterval(() => {
      if (index < locationEvents.length) {
        const event = locationEvents[index];
        console.log(`[Demo Client] 📍 >> Client Sent Ping [${index + 1}/${locationEvents.length}]:`);
        console.log(`   - Courier:   ${event.courier_id}`);
        console.log(`   - Position:  (${event.latitude}, ${event.longitude})`);
        console.log(`   - Note:      "${event.note}"`);
        duplexStream.write(event);
        index++;
      } else {
        clearInterval(interval);
        console.log('\n[Demo Client] 📤 Finished sending all client events. Calling duplexStream.end()...\n');
        duplexStream.end();
      }
    }, 600);
  });

  orderService.getClient().close();
  console.log('✨ Bi-directional Streaming RPC Demo Completed Successfully!\n');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runBidiStreamingDemo();
}
