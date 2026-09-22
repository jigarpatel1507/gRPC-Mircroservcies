import * as grpc from '@grpc/grpc-js';
import { UserServiceClientWrapper } from '../clients/user.client.js';
import { createAuthMetadata, createInvalidAuthMetadata, createEmptyMetadata } from '../auth/metadata.js';
import {
  GetUserResponse,
  OrderStreamResponse,
  OrderLocationEvent,
  TrackOrderStatusUpdate,
} from '../types/index.js';

/**
 * OrderService manages business operations and delegates user-related queries
 * to the User Service via gRPC.
 */
export class OrderService {
  private userClient: UserServiceClientWrapper;

  constructor(userClient?: UserServiceClientWrapper) {
    this.userClient = userClient || new UserServiceClientWrapper();
  }

  /**
   * 1. Unary Flow: Fetches user information over gRPC and enriches order context.
   */
  public async fetchUserProfile(userId: string, customToken?: string): Promise<GetUserResponse> {
    const metadata = customToken !== undefined ? createAuthMetadata(customToken) : createAuthMetadata();
    return await this.userClient.getUser(userId, metadata);
  }

  /**
   * 2. Server Streaming Flow: Requests all orders for a user and streams them back.
   */
  public streamOrders(
    userId: string,
    callbacks: {
      onData: (order: OrderStreamResponse) => void;
      onError: (err: Error) => void;
      onEnd: () => void;
    }
  ): void {
    const metadata = createAuthMetadata();
    const stream = this.userClient.getUserOrders(userId, metadata);

    stream.on('data', callbacks.onData);
    stream.on('error', callbacks.onError);
    stream.on('end', callbacks.onEnd);
  }

  /**
   * 3. Bi-directional Streaming Flow: Initiates a live order tracking session.
   */
  public createTrackingSession(callbacks: {
    onStatusUpdate: (status: TrackOrderStatusUpdate) => void;
    onError: (err: Error) => void;
    onEnd: () => void;
  }): grpc.ClientDuplexStream<OrderLocationEvent, TrackOrderStatusUpdate> {
    const metadata = createAuthMetadata();
    const stream = this.userClient.trackOrder(metadata);

    stream.on('data', callbacks.onStatusUpdate);
    stream.on('error', callbacks.onError);
    stream.on('end', callbacks.onEnd);

    return stream;
  }

  /**
   * 4. Auth Failure Demonstration: Intentionally calls user-service with an invalid/missing token.
   */
  public async testAuthFailure(scenario: 'invalid-token' | 'missing-token', userId: string): Promise<void> {
    const metadata = scenario === 'invalid-token' ? createInvalidAuthMetadata() : createEmptyMetadata();
    await this.userClient.getUser(userId, metadata);
  }

  public getClient(): UserServiceClientWrapper {
    return this.userClient;
  }
}
