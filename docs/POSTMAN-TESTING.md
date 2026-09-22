# Testing gRPC Microservices with Postman (Step-by-Step Guide)

Postman has native, built-in support for testing gRPC APIs (Unary, Server Streaming, Client Streaming, and Bi-directional Streaming).

Follow this step-by-step guide to test this project in Postman.

---

## Prerequisites

1. **Postman App**: Download and open [Postman](https://www.postman.com/downloads/) (Desktop app is recommended for local `localhost` testing).
2. **Start the User Service Server**:
   Open a terminal in your project root and run:
   ```bash
   npm run start:user
   ```
   Confirm the server is running on `127.0.0.1:50051`.

---

## Step 1: Create a New gRPC Request in Postman

1. Open Postman.
2. In the top-left sidebar, click **"New"** (or click the **`+`** icon to open a new tab).
3. Select **"gRPC"** (instead of standard HTTP).

---

## Step 2: Configure Server URL and Import `.proto`

1. In the **Enter server URL** field, type:
   ```text
   127.0.0.1:50051
   ```
2. Click the **"Service definition"** dropdown right below the URL.
3. Choose **"Import a .proto file"** -> **"Add file"**.
4. Browse to your project folder and select:
   ```text
   proto/user.proto
   ```
5. Click **"Next"** and then **"Save and finish"**.
6. Now, in the **"Select a method"** dropdown, Postman will automatically list the 3 methods from `user.UserService`:
   - `GetUser`
   - `GetUserOrders`
   - `TrackOrder`

---

## Step 3: Add Authentication Metadata

All endpoints in `user-service` require authentication metadata.

1. Under the URL input, click the **"Metadata"** tab.
2. Add a new metadata row:
   - **Key**: `authorization`
   - **Value**: `Bearer demo-token`

*(Tip: In gRPC, metadata keys are lowercase, equivalent to HTTP headers).*

---

## Step 4: Test Each of the gRPC Methods

### Test 1: Unary RPC (`GetUser`)

1. Select method: **`user.UserService/GetUser`**
2. Click the **"Message"** tab and enter:
   ```json
   {
     "user_id": "user-1"
   }
   ```
3. Click the blue **"Invoke"** button.
4. **Expected Response:**
   ```json
   {
     "id": "user-1",
     "name": "Alice Johnson",
     "email": "alice@example.com",
     "role": "customer"
   }
   ```
   Status: `0 OK`

---

### Test 2: Server Streaming RPC (`GetUserOrders`)

1. Select method: **`user.UserService/GetUserOrders`**
2. Click the **"Message"** tab and enter:
   ```json
   {
     "user_id": "user-1"
   }
   ```
3. Click **"Invoke"**.
4. **Expected Behavior:**
   - Watch the response pane at the bottom.
   - You will see **3 response messages arrive one by one** with a slight delay.
   - The stream terminates with status `0 OK`.

---

### Test 3: Bi-directional Streaming (`TrackOrder`)

1. Select method: **`user.UserService/TrackOrder`**
2. Click **"Invoke"** to start the streaming session.
3. In the message box below, compose your first GPS ping:
   ```json
   {
     "order_id": "ord-102",
     "courier_id": "courier-42",
     "latitude": 37.7749,
     "longitude": -122.4194,
     "note": "Package picked up from distribution center"
   }
   ```
4. Click **"Send"**.
   - Notice the server responds immediately in the response log with status `ON_THE_WAY` and `ETA: 20 minutes`.
5. Send another message:
   ```json
   {
     "order_id": "ord-102",
     "courier_id": "courier-42",
     "latitude": 37.7952,
     "longitude": -122.4028,
     "note": "Arrived at customer location"
   }
   ```
6. Click **"Send"**.
   - Server responds with `ARRIVING_NOW` and `ETA: 5 minutes`.
7. Click **"End streaming"** when you are done.

---

### Test 4: Authentication Failure Test

1. Switch back to the **"Metadata"** tab.
2. Change the value of `authorization` to:
   ```text
   Bearer wrong-token
   ```
3. Go back to `GetUser` and click **"Invoke"**.
4. **Expected Result:**
   - Status: **`16 UNAUTHENTICATED`**
   - Details: `Authentication failed: Invalid token 'wrong-token'. Expected 'demo-token'.`
