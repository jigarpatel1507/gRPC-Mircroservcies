/**
 * Domain and Protocol Buffers Request/Response types for user-service.
 * These types mirror the contracts defined in proto/user.proto.
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

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface OrderRecord {
  orderId: string;
  userId: string;
  itemName: string;
  amount: number;
  status: string;
  timestamp: string;
}
