# API Map & gRPC Method Contracts

This document provides a complete specification for all gRPC procedures exposed by `user-service` and consumed by `order-service`.

---

## Service: `user.UserService`

Package: `user`  
File: `proto/user.proto`

---

### Method 1: `GetUser`

Retrieves a single user's profile information by ID.

- **RPC Type**: Unary RPC (1 Request ➔ 1 Response)
- **Authentication**: Required (`authorization: Bearer <token>`)

#### Request Message: `GetUserRequest`
| Field Number | Field Name | Data Type | Description | Required |
| :--- | :--- | :--- | :--- | :--- |
| `1` | `user_id` | `string` | Unique identifier of the user (e.g. `user-1`) | Yes |

#### Response Message: `GetUserResponse`
| Field Number | Field Name | Data Type | Description |
| :--- | :--- | :--- | :--- |
| `1` | `id` | `string` | Unique user identifier |
| `2` | `name` | `string` | Full name of the user |
| `3` | `email` | `string` | Email address |
| `4` | `role` | `string` | User role (`customer`, `premium-customer`, `admin`) |

#### Possible Status Codes:
- `0 (OK)`: User found and returned successfully.
- `3 (INVALID_ARGUMENT)`: `user_id` was empty or missing.
- `5 (NOT_FOUND)`: No user exists with the requested `user_id`.
- `16 (UNAUTHENTICATED)`: Missing or invalid `authorization` metadata header.

---

### Method 2: `GetUserOrders`

Streams all historical and active orders associated with a given user ID.

- **RPC Type**: Server Streaming (1 Request ➔ Stream of Responses)
- **Authentication**: Required (`authorization: Bearer <token>`)

#### Request Message: `GetUserOrdersRequest`
| Field Number | Field Name | Data Type | Description | Required |
| :--- | :--- | :--- | :--- | :--- |
| `1` | `user_id` | `string` | Target user ID | Yes |

#### Streamed Response Message: `OrderStreamResponse`
| Field Number | Field Name | Data Type | Description |
| :--- | :--- | :--- | :--- |
| `1` | `order_id` | `string` | Unique order identifier (e.g. `ord-101`) |
| `2` | `user_id` | `string` | Owner user ID |
| `3` | `item_name` | `string` | Name of the ordered item |
| `4` | `amount` | `double` | Price / Total amount |
| `5` | `status` | `string` | Order status (`PROCESSING`, `IN_TRANSIT`, `DELIVERED`, `DISPATCHED`) |
| `6` | `timestamp` | `string` | ISO 8601 formatted timestamp |

#### Stream Lifecycle:
1. Client sends single `GetUserOrdersRequest`.
2. Server validates authentication metadata.
3. Server emits multiple `OrderStreamResponse` messages sequentially.
4. Server calls `call.end()`, signaling end-of-stream (EOF) with status `0 (OK)`.

---

### Method 3: `TrackOrder`

Enables real-time bi-directional telemetry: client sends GPS coordinates and status notes, while server responds with live progress and estimated delivery times.

- **RPC Type**: Bi-directional Streaming (Stream of Requests 🔁 Stream of Responses)
- **Authentication**: Required (`authorization: Bearer <token>`)

#### Incoming Message (Client ➔ Server): `OrderLocationEvent`
| Field Number | Field Name | Data Type | Description |
| :--- | :--- | :--- | :--- |
| `1` | `order_id` | `string` | ID of the order being tracked |
| `2` | `courier_id` | `string` | Courier identifier |
| `3` | `latitude` | `double` | GPS latitude coordinate |
| `4` | `longitude` | `double` | GPS longitude coordinate |
| `5` | `note` | `string` | Checkpoint status note (e.g. "Departed facility") |

#### Outgoing Message (Server ➔ Client): `TrackOrderStatusUpdate`
| Field Number | Field Name | Data Type | Description |
| :--- | :--- | :--- | :--- |
| `1` | `order_id` | `string` | Correlated order ID |
| `2` | `status` | `string` | Current delivery status (`ON_THE_WAY`, `ARRIVING_NOW`) |
| `3` | `estimated_delivery` | `string` | Calculated delivery time remaining (e.g. `15 minutes`) |
| `4` | `message` | `string` | Server confirmation and waypoint feedback |
| `5` | `timestamp` | `string` | ISO 8601 server timestamp |

---

## Summary of Standard gRPC Status Codes

| Code | Name | Meaning in this Project |
| :--- | :--- | :--- |
| `0` | `OK` | RPC succeeded without error |
| `3` | `INVALID_ARGUMENT` | Missing required input argument |
| `5` | `NOT_FOUND` | User record does not exist in store |
| `16` | `UNAUTHENTICATED` | Bearer token invalid or metadata omitted |
