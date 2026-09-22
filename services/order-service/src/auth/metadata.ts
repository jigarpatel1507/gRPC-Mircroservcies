import * as grpc from '@grpc/grpc-js';

/**
 * Creates a gRPC Metadata instance containing the Bearer token header.
 * 
 * gRPC Metadata behaves like HTTP headers.
 * Key: 'authorization'
 * Value: 'Bearer <token>'
 */
export function createAuthMetadata(token?: string): grpc.Metadata {
  const metadata = new grpc.Metadata();
  const effectiveToken = token ?? process.env.AUTH_DEMO_TOKEN ?? 'demo-token';
  metadata.add('authorization', `Bearer ${effectiveToken}`);
  return metadata;
}

/**
 * Creates metadata with an invalid token to demonstrate gRPC authentication rejection.
 */
export function createInvalidAuthMetadata(): grpc.Metadata {
  const metadata = new grpc.Metadata();
  metadata.add('authorization', 'Bearer completely-invalid-secret-token');
  return metadata;
}

/**
 * Creates empty metadata to demonstrate rejection when authorization header is omitted.
 */
export function createEmptyMetadata(): grpc.Metadata {
  return new grpc.Metadata();
}
