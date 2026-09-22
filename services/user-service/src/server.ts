import * as grpc from '@grpc/grpc-js';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { registerUserService } from './services/user.grpc.js';

// Resolve environment file from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const PORT = process.env.USER_SERVICE_PORT || '50051';
const HOST = process.env.USER_SERVICE_HOST || '0.0.0.0';
const BIND_ADDRESS = `${HOST}:${PORT}`;

export function createServer(): grpc.Server {
  const server = new grpc.Server({
    'grpc.max_receive_message_length': 1024 * 1024 * 4, // 4MB standard limit
    'grpc.max_send_message_length': 1024 * 1024 * 4,
  });

  registerUserService(server);
  return server;
}

export function startServer(): grpc.Server {
  const server = createServer();

  server.bindAsync(
    BIND_ADDRESS,
    grpc.ServerCredentials.createInsecure(),
    (err: Error | null, _port: number) => {
      if (err) {
        console.error(`[user-service] ❌ Failed to bind to ${BIND_ADDRESS}:`, err.message);
        process.exit(1);
      }

      console.log(`====================================================`);
      console.log(`🚀 [user-service] gRPC Server running at ${BIND_ADDRESS}`);
      console.log(`🔑 Auth: Bearer token validation active ('${process.env.AUTH_DEMO_TOKEN || 'demo-token'}')`);
      console.log(`📡 Ready to accept RPC requests.`);
      console.log(`====================================================\n`);
    }
  );

  // Graceful shutdown handling
  const handleShutdown = (signal: string) => {
    console.log(`\n[user-service] 🛑 Received ${signal}. Gracefully stopping gRPC server...`);
    server.tryShutdown((err) => {
      if (err) {
        console.warn(`[user-service] ⚠️ Graceful shutdown error, forcing exit:`, err.message);
        server.forceShutdown();
      } else {
        console.log(`[user-service] ✅ gRPC Server closed successfully.`);
      }
      process.exit(0);
    });
  };

  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));

  return server;
}

// Start immediately if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer();
}
