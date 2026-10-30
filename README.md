# Autocannon Testing Demo

A small playground for learning **load testing** with [autocannon](https://github.com/mcollina/autocannon).

- `backend/` — an Express + Bun API for rooms and bookings (data lives in memory).
- `tester/` — a script that hits each endpoint with autocannon and prints the results.

## API

| Method | Path              | Body                       |
| ------ | ----------------- | -------------------------- |
| POST   | `/rooms`          | `{ "roomId", "roomName" }` |
| GET    | `/rooms`          | –                          |
| GET    | `/rooms/:id`      | –                          |
| PUT    | `/rooms/:id`      | `{ "roomName" }`           |
| DELETE | `/rooms/:id`      | –                          |
| POST   | `/rooms/:id/book` | `{ "userId" }`             |

Booking uses an in-memory lock (`r:<roomId>`), so when 100 connections try to book the same room at once, only the first one wins. The concurrent booking test shows this.

## Run locally

You need [Bun](https://bun.sh).

```bash
# terminal 1: start the API on http://localhost:4000
cd backend
bun install
bun index.ts

# terminal 2: run the load tests
cd tester
bun install
bun index.ts
```

## Plain autocannon commands

Run these with the backend running. `-c` is the number of connections, `-d` is the duration in seconds.

```bash
# GET all rooms
npx autocannon -c 50 -d 10 http://localhost:4000/rooms

# GET one room
npx autocannon -c 50 -d 10 http://localhost:4000/rooms/1

# POST create a room
npx autocannon -c 10 -d 5 -m POST -H "content-type: application/json" \
  -b '{"roomId":"1","roomName":"Test Room"}' http://localhost:4000/rooms

# PUT update a room
npx autocannon -c 10 -d 5 -m PUT -H "content-type: application/json" \
  -b '{"roomName":"Updated Room"}' http://localhost:4000/rooms/1

# DELETE a room
npx autocannon -c 10 -d 5 -m DELETE http://localhost:4000/rooms/1

# Concurrent booking (100 users race for the same room)
npx autocannon -c 100 -d 10 -m POST -H "content-type: application/json" \
  -b '{"userId":"user-1"}' http://localhost:4000/rooms/1/book
```

Other useful flags: `-a 1000` sends exactly 1000 requests, `-p 10` pipelines 10 requests per connection, and `--json` prints the result as JSON.

## Reading the results

- **Req/Sec**: throughput. Higher is better.
- **Latency (avg / p99)**: how long requests take. p99 means 99% of requests were faster than this, so it shows the worst cases.
- **Non-2xx / errors / timeouts**: requests that failed.

Note: this API returns `200` even for "room not found" or "room already booked", so autocannon counts those as successes. Look at the server logs to see what really happened, or return proper status codes like `404` and `409`.
