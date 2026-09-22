/**
 * Type definitions for order-service and its gRPC client interactions with user-service.
 */

export interface GetUserRequest {
  user_id: string;
}

export interface GetUserResponse {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface GetUserOrdersRequest {
  user_id: string;
}

export interface OrderStreamResponse {
  order_id: string;
  user_id: string;
  item_name: string;
  amount: number;
  status: string;
  timestamp: string;
}

export interface OrderLocationEvent {
  order_id: string;
  courier_id: string;
  latitude: number;
  longitude: number;
  note: string;
}

export interface TrackOrderStatusUpdate {
  order_id: string;
  status: string;
  estimated_delivery: string;
  message: string;
  timestamp: string;
}

/**
 * gRPC UserService Client interface definition
 */
export interface UserServiceClient {
  getUser(
    request: GetUserRequest,
    metadata: import('@grpc/grpc-js').Metadata,
    callback: (error: import('@grpc/grpc-js').ServiceError | null, response: GetUserResponse) => void
  ): void;

  getUserOrders(
    request: GetUserOrdersRequest,
    metadata: import('@grpc/grpc-js').Metadata
  ): import('@grpc/grpc-js').ClientReadableStream<OrderStreamResponse>;

  trackOrder(
    metadata: import('@grpc/grpc-js').Metadata
  ): import('@grpc/grpc-js').ClientDuplexStream<OrderLocationEvent, TrackOrderStatusUpdate>;

  close(): void;
}
