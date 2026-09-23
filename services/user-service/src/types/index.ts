/**
 * Re-exporting automatically generated TypeScript types and interfaces
 * compiled directly from proto/user.proto via `npm run proto:generate`.
 * 
 * Do NOT manually create proto types here. Always update proto/user.proto
 * and run `npm run proto:generate`.
 */

export type { GetUserRequest } from '../../../../proto/generated/user/GetUserRequest.js';
export type { GetUserResponse } from '../../../../proto/generated/user/GetUserResponse.js';
export type { GetUserOrdersRequest } from '../../../../proto/generated/user/GetUserOrdersRequest.js';
export type { OrderStreamResponse } from '../../../../proto/generated/user/OrderStreamResponse.js';
export type { OrderLocationEvent } from '../../../../proto/generated/user/OrderLocationEvent.js';
export type { TrackOrderStatusUpdate } from '../../../../proto/generated/user/TrackOrderStatusUpdate.js';
export type { UserServiceHandlers, UserServiceClient, UserServiceDefinition } from '../../../../proto/generated/user/UserService.js';
export type { ProtoGrpcType } from '../../../../proto/generated/user.js';

// Internal in-memory database entity types
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
