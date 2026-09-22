import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import {
  GetUserRequest,
  GetUserResponse,
  GetUserOrdersRequest,
  OrderStreamResponse,
  OrderLocationEvent,
  TrackOrderStatusUpdate,
} from '../types/index.js';
import { createAuthMetadata } from '../auth/metadata.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROTO_PATH = path.resolve(__dirname, '../../../../proto/user.proto');

interface ProtoGrpcType {
  user: {
    UserService: {
      new (address: string, credentials: grpc.ChannelCredentials): RawUserServiceClient;
    };
  };
}

interface RawUserServiceClient extends grpc.Client {
  GetUser(
    request: GetUserRequest,
    metadata: grpc.Metadata,
    callback: (error: grpc.ServiceError | null, response: GetUserResponse) => void
  ): grpc.ClientUnaryCall;

  GetUserOrders(
    request: GetUserOrdersRequest,
    metadata: grpc.Metadata
  ): grpc.ClientReadableStream<OrderStreamResponse>;

  TrackOrder(
    metadata: grpc.Metadata
  ): grpc.ClientDuplexStream<OrderLocationEvent, TrackOrderStatusUpdate>;
}

export class UserServiceClientWrapper {
  private client: RawUserServiceClient;
  private readonly targetAddress: string;

  constructor(targetAddress?: string) {
    const host = process.env.USER_SERVICE_HOST || '127.0.0.1';
    const port = process.env.USER_SERVICE_PORT || '50051';
    this.targetAddress = targetAddress || `${host}:${port}`;

    const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });

    const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as unknown as ProtoGrpcType;

    this.client = new protoDescriptor.user.UserService(
      this.targetAddress,
      grpc.credentials.createInsecure()
    );
  }

  /**
   * 1. UNARY RPC: GetUser
   * Wraps the gRPC callback in a Promise for modern async/await syntax.
   */
  public getUser(userId: string, metadata?: grpc.Metadata): Promise<GetUserResponse> {
    const effectiveMetadata = metadata || createAuthMetadata();
    const request: GetUserRequest = { user_id: userId };

    return new Promise((resolve, reject) => {
      this.client.GetUser(request, effectiveMetadata, (error, response) => {
        if (error) {
          return reject(error);
        }
        resolve(response);
      });
    });
  }

  /**
   * 2. SERVER STREAMING RPC: GetUserOrders
   * Returns a readable stream emitting 'data', 'error', and 'end' events.
   */
  public getUserOrders(userId: string, metadata?: grpc.Metadata): grpc.ClientReadableStream<OrderStreamResponse> {
    const effectiveMetadata = metadata || createAuthMetadata();
    const request: GetUserOrdersRequest = { user_id: userId };
    return this.client.GetUserOrders(request, effectiveMetadata);
  }

  /**
   * 3. BI-DIRECTIONAL STREAMING RPC: TrackOrder
   * Returns a duplex stream for sending events and listening for updates.
   */
  public trackOrder(metadata?: grpc.Metadata): grpc.ClientDuplexStream<OrderLocationEvent, TrackOrderStatusUpdate> {
    const effectiveMetadata = metadata || createAuthMetadata();
    return this.client.TrackOrder(effectiveMetadata);
  }

  /**
   * Closes the gRPC client channel.
   */
  public close(): void {
    this.client.close();
  }

  public getAddress(): string {
    return this.targetAddress;
  }
}
