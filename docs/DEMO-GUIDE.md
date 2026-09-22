# 10-15 Minute gRPC Presentation & Demo Guide

This guide is designed for presenting this project to teammates, students, or interviewers in a structured **10–15 minute live demo**.

---

## Presentation Checklist & Time Allocation

| # | Step / Topic | Duration | Key Talking Points |
| :--- | :--- | :--- | :--- |
| **1** | What is gRPC? | 1 min | RPC concept, HTTP/2 multiplexing, remote calls like local functions |
| **2** | Why Protocol Buffers? | 1 min | Compact binary serialization, field numbers, language-agnostic IDL |
| **3** | Two-Service Architecture | 1 min | `user-service` (Server), `order-service` (Client), decoupling |
| **4** | Explain `user.proto` | 1.5 min | Service definition, RPC methods, message definitions |
| **5** | Start User Service | 30 sec | Port 50051, gRPC Server credentials, graceful shutdown |
| **6** | Start Order Service | 30 sec | Port 50052, client stub connection |
| **7** | Demo 1: Unary RPC | 2 min | `GetUser`: single request/response, user lookup, error handling |
| **8** | Demo 2: Server Streaming | 2 min | `GetUserOrders`: 1 request, multiple streamed orders with interval |
| **9** | Demo 3: Bi-directional Streaming | 2 min | `TrackOrder`: courier sends pings, server sends live ETA updates |
| **10** | Demo 4: Metadata Auth | 1.5 min | Bearer token in metadata, successful check vs 401 UNAUTHENTICATED |
| **11** | Important Code Tour | 1.5 min | `@grpc/proto-loader`, handler signatures, Promises wrapper |
| **12** | Limitations & Production Upgrades | 1 min | Interceptors, mTLS, JWT verification, Protobuf code-gen |

---

## Detailed Step-by-Step Script

### Step 1: What is gRPC? (1 min)
> *"Welcome! Today we are looking at how modern distributed systems handle interservice communication using **gRPC**.*  
> *Unlike traditional REST APIs that rely on text-based JSON over HTTP/1.1, gRPC runs natively on **HTTP/2**. It allows one service to call a method on another service directly as if it were a local function call, offering multiplexing and high throughput."*

### Step 2: Why Protocol Buffers? (1 min)
> *"gRPC uses **Protocol Buffers** (Protobuf) as both its Interface Definition Language and its wire format.*  
> *In JSON, field names like 'email' or 'timestamp' are repeated in every single packet. In Protobuf, fields are mapped to tiny numeric tags (1, 2, 3), resulting in payloads that are up to 50% smaller and serialize up to 10x faster."*

### Step 3: Two-Service Architecture (1 min)
> *"In our demo, we have two clean microservices:*  
> *1. **User Service**: Runs on port 50051 as a gRPC Server and owns user data and tracking logic.*  
> *2. **Order Service**: Runs as a gRPC Client, initiating calls and demonstrating all communication styles.*  
> *Everything is written in Node.js and strict TypeScript."*

### Step 4: Explain `proto/user.proto` (1.5 min)
Open [proto/user.proto](file:///j:/DEV%20IT/Projects/gRPC%20Demo/gRPC-Mircroservcies/proto/user.proto) and highlight:
- The `syntax = "proto3";` declaration.
- `service UserService` exposing:
  - `rpc GetUser(...) returns (...)` (Unary)
  - `rpc GetUserOrders(...) returns (stream ...)` (Server Streaming)
  - `rpc TrackOrder(stream ...) returns (stream ...)` (Bi-directional Streaming)
- Show how messages define typed fields with numbers (`string user_id = 1;`).

---

### Step 5 & 6: Start the Services (1 min)

Open two terminal windows:

**Terminal 1 (User Service Server):**
```bash
npm run start:user
```
*Point out: The server binds to port 50051 using insecure credentials and loads the proto definition.*

**Terminal 2 (Order Service Client):**
```bash
npm run start:order
```
*Point out: The client initializes its connection channel to user-service.*

---

### Step 7: Demonstrate Unary RPC (2 min)

In a third terminal (or Terminal 2):
```bash
npm run demo:unary
```
**What to explain:**
- Order Service sends `userId: "user-1"`.
- User Service looks up Alice Johnson and returns one response.
- Point out the negative test: querying `user-999` returns gRPC status code `5 (NOT_FOUND)`.

---

### Step 8: Demonstrate Server Streaming (2 min)

Run:
```bash
npm run demo:streaming
```
**What to explain:**
- Notice how the client made only **one request**.
- The server streamed back 3 order records one after another in real-time.
- Point out the terminal logs showing stream chunk arrivals followed by the EOF `end` event.

---

### Step 9: Demonstrate Bi-directional Streaming (2 min)

Run:
```bash
npm run demo:bidi
```
**What to explain:**
- This is a full-duplex communication channel over a single HTTP/2 connection.
- The client streams courier GPS updates (from Depot to Customer building).
- Concurrently, the server processes each ping and streams back real-time ETA updates.
- Neither side blocks the other; both streams operate simultaneously.

---

### Step 10: Demonstrate Authentication Metadata (1.5 min)

Run:
```bash
npm run demo:auth
```
**What to explain:**
- Show Scenario 1: Valid Bearer token (`demo-token`) succeeds.
- Show Scenario 2: Tampered token (`invalid-tampered-token`) is immediately rejected with gRPC status code `16 (UNAUTHENTICATED)`.
- Show Scenario 3: Request without metadata is also blocked with `16 (UNAUTHENTICATED)`.
- Explain that gRPC uses `Metadata` headers passed in HTTP/2 HEADERS frames.

---

### Step 11: Explain Important Code (1.5 min)

1. Show [user.handler.ts](file:///j:/DEV%20IT/Projects/gRPC%20Demo/gRPC-Mircroservcies/services/user-service/src/handlers/user.handler.ts):
   - Explain `callback(null, user)` for Unary.
   - Explain `call.write(order)` and `call.end()` for Server Streaming.
   - Explain `call.on('data')` and `call.write()` for Duplex Streaming.
2. Show [user.client.ts](file:///j:/DEV%20IT/Projects/gRPC%20Demo/gRPC-Mircroservcies/services/order-service/src/clients/user.client.ts):
   - Explain how gRPC callbacks are wrapped in modern async/await Promises.

---

### Step 12: Limitations & Production Improvements (1 min)
> *"In a production deployment, we would expand this foundation with:*  
> *1. **gRPC Interceptors** for automated logging, tracing (OpenTelemetry), and centralized auth.*  
> *2. **Mutual TLS (mTLS)** for cryptographic identity verification between services.*  
> *3. **Pre-compiled TypeScript stubs** using `ts-proto` or `protoc-gen-ts` instead of dynamic runtime proto loading.*  
> *4. **Connection pooling and client-side load balancing** using service discovery like Consul or Kubernetes DNS.*"
