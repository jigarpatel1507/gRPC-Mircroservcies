import * as grpc from '@grpc/grpc-js';

/**
 * Authentication module for gRPC requests.
 * 
 * In gRPC, headers/metadata are passed via grpc.Metadata objects (key-value pairs)
 * accompanying each RPC call. This module inspects the incoming metadata for the
 * 'authorization' key (keys in gRPC metadata are case-insensitive and lowercased).
 */

const EXPECTED_TOKEN = process.env.AUTH_DEMO_TOKEN || 'demo-token';

export interface AuthResult {
  isAuthenticated: boolean;
  error?: grpc.ServiceError;
}

/**
 * Validates the gRPC metadata for a valid Bearer token.
 * 
 * Expected format:
 *   Metadata key: "authorization"
 *   Metadata value: "Bearer demo-token"
 * 
 * If valid, returns { isAuthenticated: true }.
 * If invalid or missing, returns { isAuthenticated: false, error: ServiceError }.
 */
export function validateAuthMetadata(metadata: grpc.Metadata): AuthResult {
  // Retrieve the 'authorization' metadata values (returns string[] or Buffer[])
  const authHeaders = metadata.get('authorization');

  if (!authHeaders || authHeaders.length === 0) {
    const error: grpc.ServiceError = {
      name: 'Unauthenticated',
      message: 'Authentication failed: Missing "authorization" metadata header.',
      code: grpc.status.UNAUTHENTICATED,
      details: 'You must provide metadata with key "authorization" and value "Bearer <token>".',
      metadata: new grpc.Metadata(),
    };
    return { isAuthenticated: false, error };
  }

  const tokenString = String(authHeaders[0]);
  const parts = tokenString.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    const error: grpc.ServiceError = {
      name: 'Unauthenticated',
      message: 'Authentication failed: Invalid authorization format. Expected "Bearer <token>".',
      code: grpc.status.UNAUTHENTICATED,
      details: 'Authorization header format must be "Bearer <token>".',
      metadata: new grpc.Metadata(),
    };
    return { isAuthenticated: false, error };
  }

  const receivedToken = parts[1];
  if (receivedToken !== EXPECTED_TOKEN) {
    const error: grpc.ServiceError = {
      name: 'Unauthenticated',
      message: `Authentication failed: Invalid token '${receivedToken}'. Expected '${EXPECTED_TOKEN}'.`,
      code: grpc.status.UNAUTHENTICATED,
      details: 'The provided token does not match the configured demo token.',
      metadata: new grpc.Metadata(),
    };
    return { isAuthenticated: false, error };
  }

  return { isAuthenticated: true };
}
