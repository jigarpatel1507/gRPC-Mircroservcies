import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as grpc from '@grpc/grpc-js';
import { OrderService } from '../services/order-service/src/services/order.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export async function runAuthDemo() {
  console.log('================================================================');
  console.log('📌 DEMO 4: Authentication Flow via gRPC Metadata');
  console.log('   Pattern: Client -> Metadata Header -> Server Auth Check -> Handler');
  console.log('================================================================\n');

  const orderService = new OrderService();
  const testUserId = 'user-1';

  // --------------------------------------------------------------------------
  // Scenario 1: Request WITH Valid Bearer Token
  // --------------------------------------------------------------------------
  console.log('----------------------------------------------------------------');
  console.log('🟢 SCENARIO 1: Request with VALID Bearer Token');
  console.log(`   Metadata: { "authorization": "Bearer ${process.env.AUTH_DEMO_TOKEN || 'demo-token'}" }`);
  console.log('----------------------------------------------------------------');

  try {
    const user = await orderService.fetchUserProfile(testUserId);
    console.log('✅ Server Accepted Request! Authenticated successfully.');
    console.log(`   User Returned: ${user.name} (${user.email})\n`);
  } catch (err) {
    console.error('❌ Unexpected error in valid auth test:', err);
  }

  // --------------------------------------------------------------------------
  // Scenario 2: Request WITH Invalid Bearer Token
  // --------------------------------------------------------------------------
  console.log('----------------------------------------------------------------');
  console.log('🔴 SCENARIO 2: Request with INVALID Bearer Token');
  console.log('   Metadata: { "authorization": "Bearer invalid-tampered-token" }');
  console.log('----------------------------------------------------------------');

  try {
    await orderService.testAuthFailure('invalid-token', testUserId);
    console.error('❌ FAILED: Server should have rejected this call, but accepted it.');
  } catch (err: unknown) {
    const grpcError = err as grpc.ServiceError;
    console.log('🛡️ Server Correctly REJECTED Request!');
    console.log(`   - gRPC Status Code:    ${grpcError.code} (${grpc.status[grpcError.code]})`);
    console.log(`   - Server Error Detail: ${grpcError.message}\n`);
  }

  // --------------------------------------------------------------------------
  // Scenario 3: Request WITHOUT Any Authorization Metadata
  // --------------------------------------------------------------------------
  console.log('----------------------------------------------------------------');
  console.log('🔴 SCENARIO 3: Request with MISSING Metadata Header');
  console.log('   Metadata: {} (empty)');
  console.log('----------------------------------------------------------------');

  try {
    await orderService.testAuthFailure('missing-token', testUserId);
    console.error('❌ FAILED: Server should have rejected this call, but accepted it.');
  } catch (err: unknown) {
    const grpcError = err as grpc.ServiceError;
    console.log('🛡️ Server Correctly REJECTED Request!');
    console.log(`   - gRPC Status Code:    ${grpcError.code} (${grpc.status[grpcError.code]})`);
    console.log(`   - Server Error Detail: ${grpcError.message}\n`);
  }

  orderService.getClient().close();
  console.log('✨ gRPC Metadata Authentication Demo Completed Successfully!\n');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runAuthDemo();
}
