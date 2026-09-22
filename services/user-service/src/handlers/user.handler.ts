import * as grpc from '@grpc/grpc-js';
import { validateAuthMetadata } from '../auth/auth.js';
import {
  GetUserRequest,
  GetUserResponse,
  GetUserOrdersRequest,
  OrderStreamResponse,
  OrderLocationEvent,
  TrackOrderStatusUpdate,
  UserRecord,
  OrderRecord,
} from '../types/index.js';

// ============================================================================
// In-Memory Database (No external DB needed for this learning demo)
// ============================================================================

const USERS: Record<string, UserRecord> = {
  'user-1': {
    id: 'user-1',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    role: 'customer',
  },
  'user-2': {
    id: 'user-2',
    name: 'Bob Smith',
    email: 'bob@example.com',
    role: 'premium-customer',
  },
  'user-3': {
    id: 'user-3',
    name: 'Charlie Davis',
    email: 'charlie@example.com',
    role: 'admin',
  },
};

const ORDERS: OrderRecord[] = [
  {
    orderId: 'ord-101',
    userId: 'user-1',
    itemName: 'Mechanical Keyboard (RGB)',
    amount: 129.99,
    status: 'DELIVERED',
    timestamp: '2026-09-20T10:30:00Z',
  },
  {
    orderId: 'ord-102',
    userId: 'user-1',
    itemName: 'USB-C Dual 4K Hub',
    amount: 79.5,
    status: 'IN_TRANSIT',
    timestamp: '2026-09-21T14:15:00Z',
  },
  {
    orderId: 'ord-103',
    userId: 'user-1',
    itemName: 'Noise Canceling Headphones',
    amount: 249.0,
    status: 'PROCESSING',
    timestamp: '2026-09-22T09:00:00Z',
  },
  {
    orderId: 'ord-201',
    userId: 'user-2',
    itemName: 'UltraWide 34-inch Monitor',
    amount: 499.99,
    status: 'DISPATCHED',
    timestamp: '2026-09-21T18:45:00Z',
  },
  {
    orderId: 'ord-202',
    userId: 'user-2',
    itemName: 'Ergonomic Desk Chair',
    amount: 320.0,
    status: 'DELIVERED',
    timestamp: '2026-09-18T12:00:00Z',
  },
];

// ============================================================================
// gRPC Handler Implementations
// ============================================================================

/**
 * 1. UNARY RPC: GetUser
 * 
 * Pattern: One Request -> One Response.
 * Demonstrates:
 *   - Metadata Authentication check.
 *   - Request validation (user_id presence).
 *   - Looking up user record.
 *   - Standard gRPC error handling (UNAUTHENTICATED, INVALID_ARGUMENT, NOT_FOUND).
 */
export function getUser(
  call: grpc.ServerUnaryCall<GetUserRequest, GetUserResponse>,
  callback: grpc.sendUnaryData<GetUserResponse>
): void {
  console.log(`\n[user-service] 📥 Received Unary GetUser call for user_id='${call.request.user_id}'`);

  // Step 1: Authentication check via gRPC Metadata
  const auth = validateAuthMetadata(call.metadata);
  if (!auth.isAuthenticated && auth.error) {
    console.warn(`[user-service] ❌ Authentication rejected: ${auth.error.message}`);
    return callback(auth.error, null);
  }

  const { user_id } = call.request;

  // Step 2: Validate input argument
  if (!user_id || user_id.trim() === '') {
    const error: grpc.ServiceError = {
      name: 'InvalidArgument',
      message: 'Validation error: user_id must be provided and cannot be empty.',
      code: grpc.status.INVALID_ARGUMENT,
      details: 'Field "user_id" is required.',
      metadata: new grpc.Metadata(),
    };
    console.warn(`[user-service] ⚠️ ${error.message}`);
    return callback(error, null);
  }

  // Step 3: Fetch user from in-memory database
  const user = USERS[user_id];
  if (!user) {
    const error: grpc.ServiceError = {
      name: 'NotFound',
      message: `User with id '${user_id}' was not found.`,
      code: grpc.status.NOT_FOUND,
      details: `No record matching user_id '${user_id}'.`,
      metadata: new grpc.Metadata(),
    };
    console.warn(`[user-service] ⚠️ ${error.message}`);
    return callback(error, null);
  }

  console.log(`[user-service] ✅ Found user: ${user.name} (${user.email}). Returning response.`);
  callback(null, {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
}

/**
 * 2. SERVER STREAMING RPC: GetUserOrders
 * 
 * Pattern: One Request -> Stream of Responses.
 * Demonstrates:
 *   - Client sends a single user_id.
 *   - Server writes multiple order objects sequentially (call.write()).
 *   - Server signals end of stream (call.end()).
 */
export function getUserOrders(
  call: grpc.ServerWritableStream<GetUserOrdersRequest, OrderStreamResponse>
): void {
  const { user_id } = call.request;
  console.log(`\n[user-service] 📥 Received Server-Streaming GetUserOrders call for user_id='${user_id}'`);

  // Check metadata authentication
  const auth = validateAuthMetadata(call.metadata);
  if (!auth.isAuthenticated && auth.error) {
    console.warn(`[user-service] ❌ Authentication rejected for streaming call: ${auth.error.message}`);
    call.destroy(auth.error);
    return;
  }

  // Filter orders matching the requested user_id
  const userOrders = ORDERS.filter((order) => order.userId === user_id);

  if (userOrders.length === 0) {
    console.log(`[user-service] ℹ️ No orders found for user_id='${user_id}'. Closing stream.`);
    call.end();
    return;
  }

  console.log(`[user-service] 🚀 Streaming ${userOrders.length} orders back to client with small interval...`);

  // Stream each order with a 350ms pause to clearly observe streaming behavior in the demo
  let index = 0;
  const timer = setInterval(() => {
    if (index < userOrders.length) {
      const order = userOrders[index];
      const message: OrderStreamResponse = {
        order_id: order.orderId,
        user_id: order.userId,
        item_name: order.itemName,
        amount: order.amount,
        status: order.status,
        timestamp: order.timestamp,
      };

      console.log(`[user-service] 📤 [Stream Chunk ${index + 1}/${userOrders.length}] Sent order ${order.orderId} (${order.itemName})`);
      call.write(message);
      index++;
    } else {
      clearInterval(timer);
      console.log(`[user-service] 🏁 Finished streaming all orders. Sending EOF via call.end().`);
      call.end();
    }
  }, 350);

  // Clean up timer if client cancels stream early
  call.on('cancelled', () => {
    clearInterval(timer);
    console.warn(`[user-service] ⚠️ Client cancelled GetUserOrders stream.`);
  });
}

/**
 * 3. BI-DIRECTIONAL STREAMING RPC: TrackOrder
 * 
 * Pattern: Stream of Requests <-> Stream of Responses.
 * Demonstrates:
 *   - Client sends live location updates (pings with latitude/longitude/notes).
 *   - Server listens for incoming events (call.on('data')).
 *   - Server computes ETA and live status, sending back immediate updates (call.write()).
 *   - Both sides can stream independently and terminate gracefully (call.on('end')).
 */
export function trackOrder(
  call: grpc.ServerDuplexStream<OrderLocationEvent, TrackOrderStatusUpdate>
): void {
  console.log(`\n[user-service] 📥 Bi-directional stream 'TrackOrder' session initiated.`);

  // Check metadata authentication
  const auth = validateAuthMetadata(call.metadata);
  if (!auth.isAuthenticated && auth.error) {
    console.warn(`[user-service] ❌ Authentication rejected for bidi stream: ${auth.error.message}`);
    call.destroy(auth.error);
    return;
  }

  let eventCount = 0;

  // Listen for incoming location events from the client
  call.on('data', (event: OrderLocationEvent) => {
    eventCount++;
    console.log(
      `[user-service] 📍 [Incoming Ping #${eventCount}] Order='${event.order_id}', Courier='${event.courier_id}', Pos=(${event.latitude.toFixed(4)}, ${event.longitude.toFixed(4)}), Note='${event.note}'`
    );

    // Compute simulated ETA countdown
    const remainingMinutes = Math.max(5, 25 - eventCount * 5);
    const statusUpdate: TrackOrderStatusUpdate = {
      order_id: event.order_id,
      status: remainingMinutes <= 5 ? 'ARRIVING_NOW' : 'ON_THE_WAY',
      estimated_delivery: `${remainingMinutes} minutes`,
      message: `Location received for courier ${event.courier_id}. Next waypoint registered.`,
      timestamp: new Date().toISOString(),
    };

    console.log(`[user-service] 📡 [Outgoing Update] Order='${event.order_id}', Status='${statusUpdate.status}', ETA='${statusUpdate.estimated_delivery}'`);
    call.write(statusUpdate);
  });

  // Client finished sending events
  call.on('end', () => {
    console.log(`[user-service] 🏁 Client closed incoming stream. Closing server duplex stream.`);
    call.end();
  });

  call.on('error', (err: Error) => {
    console.error(`[user-service] 💥 Error in TrackOrder duplex stream:`, err.message);
  });
}
