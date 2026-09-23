// Original file: proto/user.proto

import type * as grpc from '@grpc/grpc-js'
import type { MethodDefinition } from '@grpc/proto-loader'
import type { GetUserOrdersRequest as _user_GetUserOrdersRequest, GetUserOrdersRequest__Output as _user_GetUserOrdersRequest__Output } from '../user/GetUserOrdersRequest.js';
import type { GetUserRequest as _user_GetUserRequest, GetUserRequest__Output as _user_GetUserRequest__Output } from '../user/GetUserRequest.js';
import type { GetUserResponse as _user_GetUserResponse, GetUserResponse__Output as _user_GetUserResponse__Output } from '../user/GetUserResponse.js';
import type { OrderLocationEvent as _user_OrderLocationEvent, OrderLocationEvent__Output as _user_OrderLocationEvent__Output } from '../user/OrderLocationEvent.js';
import type { OrderStreamResponse as _user_OrderStreamResponse, OrderStreamResponse__Output as _user_OrderStreamResponse__Output } from '../user/OrderStreamResponse.js';
import type { TrackOrderStatusUpdate as _user_TrackOrderStatusUpdate, TrackOrderStatusUpdate__Output as _user_TrackOrderStatusUpdate__Output } from '../user/TrackOrderStatusUpdate.js';

export interface UserServiceClient extends grpc.Client {
  GetUser(argument: _user_GetUserRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_user_GetUserResponse__Output>): grpc.ClientUnaryCall;
  GetUser(argument: _user_GetUserRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_user_GetUserResponse__Output>): grpc.ClientUnaryCall;
  GetUser(argument: _user_GetUserRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_user_GetUserResponse__Output>): grpc.ClientUnaryCall;
  GetUser(argument: _user_GetUserRequest, callback: grpc.requestCallback<_user_GetUserResponse__Output>): grpc.ClientUnaryCall;
  getUser(argument: _user_GetUserRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_user_GetUserResponse__Output>): grpc.ClientUnaryCall;
  getUser(argument: _user_GetUserRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_user_GetUserResponse__Output>): grpc.ClientUnaryCall;
  getUser(argument: _user_GetUserRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_user_GetUserResponse__Output>): grpc.ClientUnaryCall;
  getUser(argument: _user_GetUserRequest, callback: grpc.requestCallback<_user_GetUserResponse__Output>): grpc.ClientUnaryCall;
  
  GetUserOrders(argument: _user_GetUserOrdersRequest, metadata: grpc.Metadata, options?: grpc.CallOptions): grpc.ClientReadableStream<_user_OrderStreamResponse__Output>;
  GetUserOrders(argument: _user_GetUserOrdersRequest, options?: grpc.CallOptions): grpc.ClientReadableStream<_user_OrderStreamResponse__Output>;
  getUserOrders(argument: _user_GetUserOrdersRequest, metadata: grpc.Metadata, options?: grpc.CallOptions): grpc.ClientReadableStream<_user_OrderStreamResponse__Output>;
  getUserOrders(argument: _user_GetUserOrdersRequest, options?: grpc.CallOptions): grpc.ClientReadableStream<_user_OrderStreamResponse__Output>;
  
  TrackOrder(metadata: grpc.Metadata, options?: grpc.CallOptions): grpc.ClientDuplexStream<_user_OrderLocationEvent, _user_TrackOrderStatusUpdate__Output>;
  TrackOrder(options?: grpc.CallOptions): grpc.ClientDuplexStream<_user_OrderLocationEvent, _user_TrackOrderStatusUpdate__Output>;
  trackOrder(metadata: grpc.Metadata, options?: grpc.CallOptions): grpc.ClientDuplexStream<_user_OrderLocationEvent, _user_TrackOrderStatusUpdate__Output>;
  trackOrder(options?: grpc.CallOptions): grpc.ClientDuplexStream<_user_OrderLocationEvent, _user_TrackOrderStatusUpdate__Output>;
  
}

export interface UserServiceHandlers extends grpc.UntypedServiceImplementation {
  GetUser: grpc.handleUnaryCall<_user_GetUserRequest__Output, _user_GetUserResponse>;
  
  GetUserOrders: grpc.handleServerStreamingCall<_user_GetUserOrdersRequest__Output, _user_OrderStreamResponse>;
  
  TrackOrder: grpc.handleBidiStreamingCall<_user_OrderLocationEvent__Output, _user_TrackOrderStatusUpdate>;
  
}

export interface UserServiceDefinition extends grpc.ServiceDefinition {
  GetUser: MethodDefinition<_user_GetUserRequest, _user_GetUserResponse, _user_GetUserRequest__Output, _user_GetUserResponse__Output>
  GetUserOrders: MethodDefinition<_user_GetUserOrdersRequest, _user_OrderStreamResponse, _user_GetUserOrdersRequest__Output, _user_OrderStreamResponse__Output>
  TrackOrder: MethodDefinition<_user_OrderLocationEvent, _user_TrackOrderStatusUpdate, _user_OrderLocationEvent__Output, _user_TrackOrderStatusUpdate__Output>
}
