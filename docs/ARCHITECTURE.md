# Architecture & System Design

This document details the architectural layout, service boundaries, and communication patterns of the **Node.js + TypeScript gRPC Microservices Demo**.

---

## 1. High-Level System Overview

The system consists of two independent microservices communicating via **gRPC over HTTP/2**:

```
[ External Client / Demo Runner ]
               │
               ▼
      ┌──────────────────┐
      │  Order Service   │  (Port 50052)
      │  (gRPC Client)   │
      └────────┬─────────┘
               │  gRPC Channel (HTTP/2 Multiplexed)
               │  Protobuf Binary Serialization
               │  Metadata: Authorization Bearer Header
               ▼
      ┌──────────────────┐
      │   User Service   │  (Port 50051)
      │  (gRPC Server)   │
      └──────────────────┘
```

### Microservice Roles

| Service | Primary Role | gRPC Role | Data Ownership |
| :--- | :--- | :--- | :--- |
| **`user-service`** | Manages user profiles & orders status | **Server** (`UserService`) | Users, User Order History, Real-time courier dispatch status |
| **`order-service`** | Orchestrates orders and client flows | **Client** (`UserServiceClient`) | Order workflows, delegates user lookups & streaming to `user-service` |

---

## 2. Directory Structure

The project uses a clean monorepo layout:

```text
grpc-node-ts-demo/
├── README.md               # Quickstart, conceptual overview, demo commands
├── package.json            # Root workspace config and demo runner scripts
├── tsconfig.base.json      # Base TypeScript strict compilation options
├── .env.example            # Sample ports and auth tokens
├── .gitignore              # Ignores node_modules, build outputs, and logs
│
├── proto/
│   └── user.proto          # Shared Protocol Buffers interface contract
│
├── services/
│   ├── user-service/       # Microservice 1: gRPC Server
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── server.ts            # Server bootstrap & graceful shutdown
│   │       ├── services/
│   │       │   └── user.grpc.ts     # Proto loader & service registration
│   │       ├── handlers/
│   │       │   └── user.handler.ts  # RPC method handlers (Unary, Server Stream, Bidi Stream)
│   │       ├── auth/
│   │       │   └── auth.ts          # Metadata authorization validator
│   │       └── types/
│   │           └── index.ts         # TypeScript domain interfaces
│   │
│   └── order-service/      # Microservice 2: gRPC Client
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── server.ts            # Client bootstrap & standby server
│           ├── clients/
│           │   └── user.client.ts   # Strongly-typed gRPC client wrapper
│           ├── services/
│           │   └── order.service.ts # Order domain orchestration logic
│           ├── auth/
│           │   └── metadata.ts      # gRPC Metadata header builders
│           └── types/
│               └── index.ts         # TypeScript client types
│
├── scripts/                # Execution & Presentation Scripts
│   ├── start-user-service.ts        # Starts user-service server
│   ├── start-order-service.ts       # Starts order-service
│   ├── run-unary-demo.ts            # Runs Unary RPC demo (GetUser)
│   ├── run-server-streaming-demo.ts # Runs Server Streaming demo (GetUserOrders)
│   ├── run-bidi-streaming-demo.ts   # Runs Bi-directional Streaming demo (TrackOrder)
│   ├── run-auth-demo.ts             # Runs Metadata Auth validation demo
│   └── run-all-demos.ts             # Runs all 4 demos sequentially
│
└── docs/                   # Detailed Learning & Presentation Docs
    ├── ARCHITECTURE.md     # System design & component interactions (this file)
    ├── GRPC-BASICS.md      # gRPC fundamentals vs REST, HTTP/2, Protobuf
    ├── API-MAP.md          # Method contracts, schemas, and status codes
    ├── AUTH-FLOW.md        # Metadata-based authentication deep dive
    └── DEMO-GUIDE.md       # Step-by-step 10-15 minute presentation guide
```

---

## 3. Communication Patterns in this Demo

### 1. Unary RPC (`GetUser`)
- **Nature**: Request-response (synchronous model).
- **Flow**: Order Service sends one `GetUserRequest` with `user_id`. User Service returns one `GetUserResponse` containing name, email, and role.
- **Protocol**: Single HTTP/2 DATA frame in each direction.

### 2. Server Streaming RPC (`GetUserOrders`)
- **Nature**: One request generates multiple progressive replies.
- **Flow**: Order Service sends one `GetUserOrdersRequest`. User Service returns multiple `OrderStreamResponse` frames over time, finishing with a gRPC trailer status `OK` (0).
- **Use Case**: Exporting order history, downloading large datasets, progress notifications.

### 3. Bi-directional Streaming RPC (`TrackOrder`)
- **Nature**: Full duplex asynchronous streams on a single HTTP/2 connection.
- **Flow**: Order Service sends live courier GPS coordinates (`OrderLocationEvent`). Concurrently, User Service calculates real-time ETA updates and sends them back (`TrackOrderStatusUpdate`). Both streams operate independently without blocking each other.
- **Use Case**: Live location tracking, chat systems, telemetry feeds.

### 4. Authentication through gRPC Metadata
- **Nature**: Out-of-band context passed in HTTP/2 HEADERS frame.
- **Flow**: Order Service attaches `authorization: Bearer demo-token` to metadata. User Service inspects metadata prior to executing method handlers. If invalid or missing, server terminates the call immediately with `grpc.status.UNAUTHENTICATED` (16).

---

## 4. Key Architectural Decisions

1. **Protocol Buffers as Single Source of Truth**:
   - `proto/user.proto` is shared between both services.
   - Any schema changes are explicitly defined in `.proto` files, preventing API drift between teams.
2. **Insecure Channel for Local Microservice Demo**:
   - Uses `grpc.ServerCredentials.createInsecure()` and `grpc.credentials.createInsecure()`.
   - In production, services within a Kubernetes cluster or Service Mesh often use mutual TLS (mTLS).
3. **No Heavy Frameworks or Databases**:
   - In-memory data store with simulated latency allows zero external dependencies while accurately demonstrating real-world networking semantics.
