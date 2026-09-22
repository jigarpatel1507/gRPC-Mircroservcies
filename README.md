# Node.js + TypeScript gRPC Microservices Demo

A beginner-friendly, industry-standard **Node.js + TypeScript** demonstration featuring **two microservices** (`user-service` and `order-service`) communicating over **gRPC with Protocol Buffers**.

This project is built specifically for **learning and presenting** how gRPC interservice communication works in a modern distributed architecture without extraneous framework bloat or infrastructure overhead.

---

## Table of Contents

1. [What is gRPC?](#1-what-is-grpc)
2. [Why gRPC is Being Used Here](#2-why-grpc-is-being-used-here)
3. [What Protocol Buffers Are](#3-what-protocol-buffers-are)
4. [What the Two Services Do](#4-what-the-two-services-do)
5. [Folder Structure](#5-folder-structure)
6. [How to Install Dependencies](#6-how-to-install-dependencies)
7. [How to Start Each Service](#7-how-to-start-each-service)
8. [How to Test Each Communication Pattern](#8-how-to-test-each-communication-pattern)
9. [Authentication Flow](#9-authentication-flow)
10. [Common Errors and Fixes](#10-common-errors-and-fixes)
11. [What to Explain During the Presentation](#11-what-to-explain-during-the-presentation)
12. [Further Documentation](#12-further-documentation)

---

## 1. What is gRPC?

**gRPC** (Google Remote Procedure Call) is a modern, high-performance, open-source communication framework.

In traditional web development, services communicate via REST APIs by making HTTP requests (e.g., `POST /orders`, `GET /users/123`) and passing text-based JSON payloads.

With gRPC, a client application can **directly invoke a method on a server application on another computer as if it were a local function call**:

```typescript
// With gRPC, calling a remote service feels just like calling a local function!
const user = await userClient.getUser('user-1');
```

gRPC operates over **HTTP/2**, enabling persistent TCP connections, header compression, and multiplexed bi-directional streaming.

---

## 2. Why gRPC is Being Used Here

Microservices often need fast, reliable, and strictly typed interservice communication. We use gRPC here because:

1. **High Performance & Low Latency**: Protocol Buffers binary payloads are significantly smaller and faster to serialize/deserialize than JSON.
2. **Strict Contract First**: The `.proto` file serves as a single source of truth for all teams, preventing API drift and missing fields.
3. **Native Streaming**: Traditional REST requires complex WebSockets or Server-Sent Events (SSE) to stream data. gRPC supports 4 streaming patterns natively.
4. **Multiplexing over Single TCP Connection**: Multiple calls travel over a single HTTP/2 connection without head-of-line blocking.

---

## 3. What Protocol Buffers Are

**Protocol Buffers (Protobuf)** is Google’s language-neutral, platform-neutral mechanism for serializing structured data.

Instead of transmitting verbose JSON keys repeatedly:

```json
{"user_id": "user-1", "name": "Alice Johnson", "email": "alice@example.com"}
```

Protobuf assigns small numeric tags (field numbers) to each property in a `.proto` file:

```protobuf
syntax = "proto3";

package user;

message GetUserResponse {
  string id = 1;
  string name = 2;
  string email = 3;
}
```

On the wire, only the field tags (`1`, `2`, `3`) and raw binary values are sent, reducing network bandwidth by 30–50% and dramatically accelerating processing speeds.

---

## 4. What the Two Services Do

```
[ External Client / Demo Scripts ]
               │
               ▼
      ┌──────────────────┐
      │  Order Service   │  (Runs as gRPC Client)
      │  (Port 50052)    │
      └────────┬─────────┘
               │  gRPC Channel over HTTP/2
               │  Protobuf Binary Wire Format
               │  Metadata: Authorization Bearer Header
               ▼
      ┌──────────────────┐
      │   User Service   │  (Runs as gRPC Server)
      │  (Port 50051)    │
      └──────────────────┘
```

1. **`user-service` (gRPC Server)**:
   - Owns and manages user profiles and user order histories.
   - Hosts the gRPC server on port `50051`.
   - Inspects incoming metadata for authentication tokens.
   - Implements Unary, Server Streaming, and Bi-directional Streaming RPC handlers.

2. **`order-service` (gRPC Client)**:
   - Manages order workflows and acts as the orchestrator.
   - Instantiates a strongly-typed `UserServiceClient` connecting to `user-service`.
   - Attaches `authorization: Bearer <token>` metadata to outgoing RPC calls.
   - Transforms gRPC callbacks into modern async/await Promises.

---

## 5. Folder Structure

```text
grpc-node-ts-demo/
├── README.md               # Main project overview (this file)
├── package.json            # Root workspace config and npm scripts
├── tsconfig.base.json      # Base TypeScript strict compilation configuration
├── .env.example            # Environment variables template
├── .env                    # Active local environment variables
├── .gitignore              # Git ignore rules
│
├── proto/
│   └── user.proto          # Shared Protocol Buffers interface contract
│
├── services/
│   ├── user-service/       # gRPC Server Service
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── server.ts            # gRPC server initialization & graceful shutdown
│   │       ├── services/
│   │       │   └── user.grpc.ts     # Proto loader & service registration
│   │       ├── handlers/
│   │       │   └── user.handler.ts  # RPC method handlers
│   │       ├── auth/
│   │       │   └── auth.ts          # Metadata authorization validator
│   │       └── types/
│   │           └── index.ts         # Domain types
│   │
│   └── order-service/      # gRPC Client Service
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── server.ts            # Client standby server
│           ├── clients/
│           │   └── user.client.ts   # Typed gRPC client wrapper
│           ├── services/
│           │   └── order.service.ts # Order domain business logic
│           ├── auth/
│           │   └── metadata.ts      # gRPC Metadata header builders
│           └── types/
│               └── index.ts         # Domain types
│
├── scripts/                # Execution & Demo Scripts
│   ├── start-user-service.ts        # Starts user-service
│   ├── start-order-service.ts       # Starts order-service
│   ├── run-unary-demo.ts            # Demo 1: Unary RPC (GetUser)
│   ├── run-server-streaming-demo.ts # Demo 2: Server Streaming (GetUserOrders)
│   ├── run-bidi-streaming-demo.ts   # Demo 3: Bi-directional Streaming (TrackOrder)
│   ├── run-auth-demo.ts             # Demo 4: Metadata Authentication check
│   └── run-all-demos.ts             # Runs all 4 demos in sequence
│
└── docs/                   # Detailed Learning Guides
    ├── ARCHITECTURE.md     # In-depth architectural details & flow diagrams
    ├── GRPC-BASICS.md      # gRPC fundamentals vs REST, HTTP/2, Protobuf
    ├── API-MAP.md          # Method contracts, schemas, and status codes
    ├── AUTH-FLOW.md        # Deep dive into gRPC Metadata authentication
    └── DEMO-GUIDE.md       # Step-by-step 10-15 minute live presentation guide
```

---

## 6. How to Install Dependencies

Make sure you have **Node.js (v18+)** and **npm** installed.

Clone or navigate to the repository directory and run:

```bash
npm install
```

This installs `@grpc/grpc-js`, `@grpc/proto-loader`, `tsx`, and `typescript` across all workspaces.

---

## 7. How to Start Each Service

To run the system, open **two separate terminal windows**:

### Terminal 1: Start User Service (gRPC Server)
```bash
npm run start:user
```
*Output:*
```text
====================================================
🚀 [user-service] gRPC Server running at 127.0.0.1:50051
🔑 Auth: Bearer token validation active ('demo-token')
📡 Ready to accept RPC requests.
====================================================
```

### Terminal 2: Start Order Service (gRPC Client)
```bash
npm run start:order
```
*Output:*
```text
====================================================
🚀 [order-service] Initialized
🔗 Configured to connect to user-service at: 127.0.0.1:50051
🔑 Outgoing gRPC Bearer Token: 'demo-token'
====================================================
```

---

## 8. How to Test Each Communication Pattern

With both services running, you can execute individual demo scripts in a separate terminal:

### Demo 1: Client-to-Server / Unary RPC (`GetUser`)
Demonstrates sending **1 request** and receiving **1 response**.
```bash
npm run demo:unary
```
- Fetches profile for `user-1` (Alice Johnson).
- Demonstrates error handling when requesting non-existent `user-999` (`5 NOT_FOUND`).

---

### Demo 2: Server-to-Client / Server Streaming (`GetUserOrders`)
Demonstrates sending **1 request** followed by a **stream of multiple responses** from the server.
```bash
npm run demo:streaming
```
- Sends a single `userId: "user-1"`.
- Server streams back multiple order chunks with a small delay so you can watch them arrive sequentially in real time.

---

### Demo 3: Bi-directional Streaming (`TrackOrder`)
Demonstrates **both sides streaming data asynchronously and concurrently** over a single gRPC channel.
```bash
npm run demo:bidi
```
- Courier client streams GPS location updates as the order moves towards the destination.
- Concurrently, the server processes coordinates and returns live ETA and status updates back to the client.

---

### Demo 4: Authentication Flow
Demonstrates how gRPC handles authentication via metadata headers.
```bash
npm run demo:auth
```
- **Scenario 1**: Request with valid token (`Bearer demo-token`) ➔ **Accepted (200 OK)**.
- **Scenario 2**: Request with invalid token ➔ **Rejected (`16 UNAUTHENTICATED`)**.
- **Scenario 3**: Request without metadata header ➔ **Rejected (`16 UNAUTHENTICATED`)**.

---

### Run All Demos Sequentially
To present or verify everything at once in an automated sequence:
```bash
npm run demo:all
```

---

## 9. Authentication Flow

In gRPC, authentication does not live inside the message payload. It travels in **gRPC Metadata** (equivalent to HTTP request headers).

```
Client  ──[ Metadata: { authorization: "Bearer demo-token" } ]──►  Server
                                                                      │
                                                            Validate Token
                                                            ┌─────────┴─────────┐
                                                         Valid               Invalid
                                                            │                   │
                                                    Invoke Handler     Return UNAUTHENTICATED (16)
```

1. **Client**: In `services/order-service/src/auth/metadata.ts`:
   ```typescript
   const metadata = new grpc.Metadata();
   metadata.add('authorization', 'Bearer demo-token');
   ```
2. **Server**: In `services/user-service/src/auth/auth.ts`:
   ```typescript
   const authHeaders = call.metadata.get('authorization');
   // Verify "Bearer demo-token"
   ```
3. If valid, the handler executes. If invalid or missing, server returns `grpc.status.UNAUTHENTICATED` (code 16).

---

## 10. Common Errors and Fixes

| Error Message / Status | Root Cause | Solution |
| :--- | :--- | :--- |
| `14 UNAVAILABLE: No connection established` | `user-service` is not running or port is incorrect. | Start `user-service` first (`npm run start:user`) and verify port `50051` is free. |
| `16 UNAUTHENTICATED: Missing or invalid token` | The client omitted the `authorization` header or sent an incorrect token. | Ensure `createAuthMetadata()` attaches `Bearer demo-token`. |
| `5 NOT_FOUND: User with id '...' not found` | The requested user ID does not exist in the mock database. | Use valid mock user IDs (`user-1`, `user-2`, `user-3`). |
| `3 INVALID_ARGUMENT: user_id is required` | The request payload had an empty or whitespace-only `user_id`. | Provide a valid non-empty string in the request payload. |
| `EADDRINUSE: address already in use` | Another process is already using port `50051` or `50052`. | Terminate the old process or change the port in `.env`. |

---

## 11. What to Explain During the Presentation

Follow this concise, high-impact flow (see [docs/DEMO-GUIDE.md](docs/DEMO-GUIDE.md) for full speaker notes):

1. **What is gRPC?**: Remote method invocation using HTTP/2 instead of REST.
2. **Why Protobuf?**: Compact binary wire format; strict contracts; faster serialization.
3. **Architecture**: Two services — `user-service` (Server), `order-service` (Client).
4. **Proto Walkthrough**: Open `proto/user.proto` and show the 3 RPC methods and field tags.
5. **Start Services**: Run `npm run start:user` and `npm run start:order`.
6. **Unary RPC**: Run `npm run demo:unary` — explain 1 request ➔ 1 response.
7. **Server Streaming**: Run `npm run demo:streaming` — explain 1 request ➔ progressive response chunks.
8. **Bi-directional Streaming**: Run `npm run demo:bidi` — show concurrent two-way communication.
9. **Authentication**: Run `npm run demo:auth` — show Metadata header inspection and `UNAUTHENTICATED` (16) rejection.
10. **Code Highlight**: Show how gRPC callbacks map cleanly to TypeScript Promises and event emitters.
11. **Production Upgrades**: Mention Interceptors, mTLS, and pre-compiled TypeScript stubs.

---

## 12. Further Documentation

For in-depth explanations and diagrams, review the dedicated guides in `docs/`:

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — Architectural overview, decoupling, and message flows.
- [docs/GRPC-BASICS.md](docs/GRPC-BASICS.md) — gRPC fundamentals, HTTP/2 multiplexing, Protobuf vs JSON.
- [docs/API-MAP.md](docs/API-MAP.md) — Complete specification of methods, fields, and status codes.
- [docs/AUTH-FLOW.md](docs/AUTH-FLOW.md) — Deep dive into gRPC Metadata authentication.
- [docs/POSTMAN-TESTING.md](docs/POSTMAN-TESTING.md) — Step-by-step guide to testing all methods in Postman.
- [docs/DEMO-GUIDE.md](docs/DEMO-GUIDE.md) — 10-15 minute presentation guide with slide timings and script.
