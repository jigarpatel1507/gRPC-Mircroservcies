# Authentication Flow in gRPC

This document details how authentication works in gRPC using **Metadata**, comparing it to HTTP/REST, and explaining the validation mechanics implemented in this demo.

---

## 1. What is gRPC Metadata?

In traditional REST APIs, authentication tokens are passed in HTTP request headers (e.g. `Authorization: Bearer <token>`).

In gRPC:
- Custom headers cannot be added directly to Protobuf message bodies because message structures represent pure domain data.
- Instead, gRPC provides **`Metadata`** — a key-value dictionary attached to an RPC call.
- Under the hood, gRPC transmits metadata as **HTTP/2 HEADERS frames** at the beginning of the stream.
- All metadata keys are ASCII, case-insensitive, and automatically normalized to lowercase by gRPC libraries.

---

## 2. Authentication Flow Diagram

```
┌─────────────────┐                                  ┌──────────────────┐
│  Order Service  │                                  │   User Service   │
│  (gRPC Client)  │                                  │  (gRPC Server)   │
└────────┬────────┘                                  └────────┬─────────┘
         │                                                    │
         │  1. Create Metadata:                               │
         │     authorization: Bearer demo-token               │
         │                                                    │
         │  2. Send RPC Call with Metadata                    │
         │───────────────────────────────────────────────────►│
         │                                                    │
         │                                    3. validateAuthMetadata(call.metadata)
         │                                       ├── Missing header? ──► Returns UNAUTHENTICATED (16)
         │                                       ├── Invalid format? ──► Returns UNAUTHENTICATED (16)
         │                                       └── Invalid token?  ──► Returns UNAUTHENTICATED (16)
         │                                                    │
         │                                       4. Token Matches EXPECTED_TOKEN ('demo-token')
         │                                          Proceed to invoke business handler
         │                                                    │
         │  5. Return RPC Response (status OK = 0)            │
         │◄───────────────────────────────────────────────────│
```

---

## 3. Client-Side Implementation

In `services/order-service/src/auth/metadata.ts`, metadata is prepared as follows:

```typescript
import * as grpc from '@grpc/grpc-js';

export function createAuthMetadata(token?: string): grpc.Metadata {
  const metadata = new grpc.Metadata();
  const effectiveToken = token ?? process.env.AUTH_DEMO_TOKEN ?? 'demo-token';
  // Standard header key: 'authorization'
  metadata.add('authorization', `Bearer ${effectiveToken}`);
  return metadata;
}
```

When invoking an RPC method, this metadata object is passed as the second argument:

```typescript
client.GetUser({ user_id: 'user-1' }, metadata, (error, response) => {
  // Handle response or error
});
```

---

## 4. Server-Side Implementation

In `services/user-service/src/auth/auth.ts`, the server extracts and inspects the metadata:

```typescript
export function validateAuthMetadata(metadata: grpc.Metadata): AuthResult {
  const authHeaders = metadata.get('authorization');

  if (!authHeaders || authHeaders.length === 0) {
    return {
      isAuthenticated: false,
      error: {
        name: 'Unauthenticated',
        message: 'Authentication failed: Missing "authorization" metadata header.',
        code: grpc.status.UNAUTHENTICATED, // Status code 16
        details: 'Header "authorization" is required.',
        metadata: new grpc.Metadata(),
      },
    };
  }

  const token = String(authHeaders[0]).split(' ')[1];
  if (token !== process.env.AUTH_DEMO_TOKEN) {
    return {
      isAuthenticated: false,
      error: {
        name: 'Unauthenticated',
        message: `Authentication failed: Invalid token '${token}'.`,
        code: grpc.status.UNAUTHENTICATED,
        details: 'Token mismatch.',
        metadata: new grpc.Metadata(),
      },
    };
  }

  return { isAuthenticated: true };
}
```

---

## 5. Production Considerations

For educational simplicity, this demo validates against a shared demo secret. In a production enterprise system, you would typically evolve this architecture to:

1. **gRPC Interceptors / Middleware**:
   Instead of calling `validateAuthMetadata()` inside each handler, an interceptor automatically intercepts every inbound RPC request before it reaches the handler.
2. **Cryptographic JWTs / OAuth2**:
   The client acquires an asymmetric JWT (e.g. RS256) from an identity provider (Keycloak, Auth0, Okta), and the gRPC server validates the cryptographic signature using public keys (JWKS).
3. **Mutual TLS (mTLS)**:
   In internal service-to-service networks (e.g., inside Kubernetes / Istio), services authenticate each other at the transport layer via client and server X.509 certificates.
