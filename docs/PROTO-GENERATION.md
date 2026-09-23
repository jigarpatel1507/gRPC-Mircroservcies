# Automatic TypeScript Type Generation from `.proto` Files

This document explains why and how TypeScript types are automatically generated from Protocol Buffers (`.proto`) files, addressing industry best practices and comparing the tooling options (`proto-loader-gen-types` vs `@bufbuild/protobuf`).

---

## 1. Why Automatic Type Generation? (What your Senior is pointing out)

In beginner demos, developers often write manual TypeScript interfaces to mirror `.proto` messages:

```typescript
// ❌ ANTI-PATTERN: Manually duplicating types in TypeScript
export interface GetUserRequest {
  user_id: string;
}
export interface UserServiceClient {
  getUser(...): void;
}
```

### The Problems with Manual Types:
1. **Schema Drift / Dual Maintenance**: When a backend engineer adds a new field `phone_number = 5;` to `user.proto`, manual TypeScript files easily fall out of sync.
2. **Missing Metadata / Streaming Signatures**: Manual definitions rarely capture full gRPC specifics like `call.metadata`, `CallOptions`, `ClientReadableStream`, and `ClientDuplexStream` exact signatures.
3. **Breaks "Contract-First" Principles**: The `.proto` file should be the **Single Source of Truth (SSOT)**. Code should derive from the schema, never the other way around.

---

## 2. Understanding `@bufbuild/protobuf` (Buf)

The link your senior sent (`@bufbuild/protobuf`) is from the **Buf ecosystem** ([buf.build](https://buf.build)):
- **What is Buf?** Buf is a modern, enterprise-grade tooling suite created by former Google engineers to modernize Protocol Buffers workflows.
- **What is `@bufbuild/protobuf`?** It is a modern, zero-dependency, pure-ECMAScript library for Protocol Buffers. It provides runtime serialization, deserialization, JSON mappings, and reflection.
- **When is it used?** Buf is commonly paired with **Connect-ES** (`@connectrpc/connect`) or Buf CLI code generators (`@bufbuild/protoc-gen-es`) for browser and server environments using fetch-based and HTTP/2 RPCs.

---

## 3. Tooling Comparison: `@bufbuild/protobuf` vs `proto-loader-gen-types`

| Feature | `proto-loader-gen-types` (Used in this project) | `@bufbuild/protobuf` (Buf ecosystem) |
| :--- | :--- | :--- |
| **Target Runtime** | **`@grpc/grpc-js`** (Official Node.js gRPC library) | Connect-ES, Web Fetch, ES Modules |
| **Compatibility** | Direct, 100% native integration with `protoLoader.loadSync()` and `server.addService()` | Works with ConnectRPC runtime / Buf plugins |
| **Generated Output** | Typed client classes, server handler interfaces (`UserServiceHandlers`), request/response messages | ES message classes with `.fromJson()`, `.toJson()`, `.create()` |
| **Installation** | Included directly with `@grpc/proto-loader` | Independent npm package (`@bufbuild/protobuf`) |

In this project, since our microservices use the official **`@grpc/grpc-js`** runtime, we use **`proto-loader-gen-types`** to generate the exact client and server bindings, while keeping `@bufbuild/protobuf` installed for Protobuf runtime utilities.

---

## 4. How Automatic Generation is Implemented in this Project

### Generation Command:
We configured the `proto:generate` script in `package.json`:

```bash
npm run proto:generate
```

This runs:
```bash
proto-loader-gen-types --keepCase --longs=String --enums=String --defaults --oneofs --grpcLib=@grpc/grpc-js --importFileExtension=.js --outDir=proto/generated proto/user.proto
```

### Generated Files Output (`proto/generated/`):
```text
proto/generated/
├── user.ts                         # Main package definition (ProtoGrpcType)
└── user/
    ├── GetUserRequest.ts           # Request message interface
    ├── GetUserResponse.ts          # Response message interface
    ├── GetUserOrdersRequest.ts     # Server streaming request interface
    ├── OrderStreamResponse.ts      # Server streaming chunk interface
    ├── OrderLocationEvent.ts       # Bi-directional client ping interface
    ├── TrackOrderStatusUpdate.ts   # Bi-directional server update interface
    └── UserService.ts              # Strongly-typed UserServiceClient & UserServiceHandlers
```

### How Services Consume the Types:
In `services/user-service/src/types/index.ts` and `services/order-service/src/types/index.ts`:

```typescript
// Re-export directly from generated directory:
export type { GetUserRequest } from '../../../../proto/generated/user/GetUserRequest.js';
export type { GetUserResponse } from '../../../../proto/generated/user/GetUserResponse.js';
export type { UserServiceHandlers, UserServiceClient } from '../../../../proto/generated/user/UserService.js';
export type { ProtoGrpcType } from '../../../../proto/generated/user.js';
```

---

## 5. Workflow: Adding or Changing a Field

Whenever you need to update an API:

1. **Edit `proto/user.proto`**:
   ```protobuf
   message GetUserResponse {
     string id = 1;
     string name = 2;
     string email = 3;
     string role = 4;
     string phone_number = 5; // New field
   }
   ```
2. **Run Code Generation**:
   ```bash
   npm run proto:generate
   ```
3. **TypeScript immediately reflects the new field**:
   `user.phone_number` is instantly type-checked across all services with autocomplete and zero manual interface typing!
