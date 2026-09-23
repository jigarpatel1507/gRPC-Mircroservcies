import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { getUser, getUserOrders, trackOrder } from '../handlers/user.handler.js';

import type { ProtoGrpcType, UserServiceHandlers } from '../types/index.js';

// Resolve directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to shared user.proto definition
const PROTO_PATH = path.resolve(__dirname, '../../../../proto/user.proto');

/**
 * Loads the user.proto definition and registers UserService implementations onto the gRPC server.
 */
export function registerUserService(server: grpc.Server): void {
  console.log(`[user-service] 📄 Loading Protocol Buffer from: ${PROTO_PATH}`);

  // Load proto schema with standard options
  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });

  // Convert loaded proto into strongly-typed gRPC package definition
  const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as unknown as ProtoGrpcType;
  const userService = protoDescriptor.user.UserService;

  const handlers: UserServiceHandlers = {
    GetUser: getUser,
    GetUserOrders: getUserOrders,
    TrackOrder: trackOrder,
  };

  // Bind service methods to handler functions
  server.addService(userService.service, handlers);

  console.log(`[user-service] 🔌 Registered methods on UserService: [GetUser, GetUserOrders, TrackOrder]`);
}
