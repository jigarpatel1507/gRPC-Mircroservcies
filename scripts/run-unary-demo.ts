import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as grpc from '@grpc/grpc-js';
import { OrderService } from '../services/order-service/src/services/order.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export async function runUnaryDemo() {
  console.log('================================================================');
  console.log('📌 DEMO 1: Client-to-Server / Unary RPC (GetUser)');
  console.log('   Flow: Order Service (gRPC Client) -> User Service (gRPC Server)');
  console.log('================================================================\n');

  const orderService = new OrderService();

  try {
    // 1. Success case: Query existing user 'user-1'
    const targetUserId = 'user-1';
    console.log(`[Demo Client] 1️⃣ Sending Unary Request: GetUser(userId='${targetUserId}')`);
    console.log(`[Demo Client] 🔑 Passing Metadata Header: 'authorization: Bearer ${process.env.AUTH_DEMO_TOKEN || 'demo-token'}'`);

    const user = await orderService.fetchUserProfile(targetUserId);

    console.log('\n[Demo Client] ✅ Unary Response Received:');
    console.table([user]);

    // 2. Query another user 'user-2'
    console.log(`\n[Demo Client] 2️⃣ Sending Unary Request for second user: GetUser(userId='user-2')`);
    const user2 = await orderService.fetchUserProfile('user-2');
    console.log('[Demo Client] ✅ Second User Received:');
    console.table([user2]);

    // 3. Negative validation case: User not found
    console.log(`\n[Demo Client] 3️⃣ Testing Error Handling: Querying non-existent user 'user-999'...`);
    try {
      await orderService.fetchUserProfile('user-999');
    } catch (err: unknown) {
      const grpcError = err as grpc.ServiceError;
      console.log(`[Demo Client] 🛡️ Handled expected gRPC error:`);
      console.log(`   - Code: ${grpcError.code} (${grpc.status[grpcError.code]})`);
      console.log(`   - Message: ${grpcError.message}`);
    }

    console.log('\n✨ Unary RPC Demo Completed Successfully!\n');
  } catch (error) {
    console.error('❌ Error executing Unary RPC Demo:', error);
  } finally {
    orderService.getClient().close();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runUnaryDemo();
}
