# gRPC Basics & Fundamentals

A beginner-friendly guide to understanding **gRPC (Google Remote Procedure Call)** and how it compares to traditional REST APIs.

---

## 1. What is gRPC?

**gRPC** is an open-source, high-performance Remote Procedure Call (RPC) framework initially developed by Google in 2015. 

In traditional architectures, client applications make HTTP requests (like `GET /users/123`) and parse text responses (typically JSON). With gRPC:
- A client can **directly invoke a method on a server application on a different machine as if it were a local function call**.
- Services are defined using an Interface Definition Language (IDL) called **Protocol Buffers** (`.proto`).
- Data is serialized into a lightweight **binary format** rather than verbose JSON or XML.
- Communication takes place over **HTTP/2**, enabling persistent connections and full-duplex multiplexing.

---

## 2. Why Choose gRPC over REST?

| Feature | Traditional REST + JSON | gRPC + Protocol Buffers |
| :--- | :--- | :--- |
| **Protocol** | Usually HTTP/1.1 (or HTTP/2 for transport only) | Native **HTTP/2** |
| **Payload Format** | Text-based JSON / XML | Compact **Binary Serialization** |
| **Performance** | Slower serialization, larger payload size | 5x to 10x faster serialization, 30-50% smaller payloads |
| **Contract** | Loose (OpenAPI/Swagger is often optional) | Strict, formal `.proto` contract enforced by compilers |
| **Streaming** | Difficult (WebSockets, Server-Sent Events require separate setups) | Native support for **4 streaming patterns** out-of-the-box |
| **Type Safety** | Requires manual validation or JSON Schema | Strongly-typed interfaces across programming languages |
| **Multiplexing** | Suffers from Head-of-Line blocking in HTTP/1.1 | Multiple requests/responses multiplexed over a single TCP connection |

---

## 3. Protocol Buffers (`.proto`) Explained

Protocol Buffers (Protobuf) is Google's language-neutral, platform-neutral mechanism for serializing structured data.

### Example Syntax:
```protobuf
syntax = "proto3";

package user;

message GetUserRequest {
  string user_id = 1;
}

message GetUserResponse {
  string id = 1;
  string name = 2;
  string email = 3;
}
```

### Why Field Numbers Matter:
In `.proto` files, each field has an assigned integer (e.g. `= 1;`, `= 2;`). 
- On the wire, Protobuf **does not send the field name string** (like `"user_id"` or `"email"`).
- Instead, it transmits only the small **integer tag** and the binary-encoded value.
- This results in tiny network payloads and lightning-fast serialization and deserialization.

---

## 4. The 4 gRPC Communication Patterns

```
1. UNARY RPC
Client  ─────── Request (1) ────────►  Server
Client  ◄────── Response (1) ───────  Server

2. SERVER STREAMING RPC
Client  ─────── Request (1) ────────►  Server
Client  ◄────── Message (Chunk 1) ──  Server
Client  ◄────── Message (Chunk 2) ──  Server
Client  ◄────── Message (Chunk N) ──  Server

3. CLIENT STREAMING RPC
Client  ─────── Message (Chunk 1) ──► Server
Client  ─────── Message (Chunk 2) ──► Server
Client  ─────── Message (Chunk N) ──► Server
Client  ◄────── Response (1) ───────  Server

4. BI-DIRECTIONAL STREAMING RPC
Client  ─────── Message (Chunk 1) ──► Server
Client  ◄────── Message (Chunk A) ──  Server
Client  ─────── Message (Chunk 2) ──► Server
Client  ◄────── Message (Chunk B) ──  Server
(Both sides send messages completely asynchronously)
```

In this demo project, we implement and showcase:
1. **Unary RPC**: `GetUser`
2. **Server Streaming RPC**: `GetUserOrders`
3. **Bi-directional Streaming RPC**: `TrackOrder`
4. **Metadata Authentication**: Bearer token authorization across calls

---

## 5. Core gRPC Terminology

- **Channel**: A long-lived, virtual connection between a client and a gRPC server endpoint.
- **Stub (Client)**: A local client-side proxy object exposing the service methods defined in `.proto`.
- **Metadata**: Key-value pairs sent with RPC requests/responses (equivalent to HTTP headers and trailers).
- **Status Code**: Standardized response status numbers (e.g., `0 = OK`, `3 = INVALID_ARGUMENT`, `5 = NOT_FOUND`, `16 = UNAUTHENTICATED`).
