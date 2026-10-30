import autocannon from "autocannon";

const BASE_URL = "http://localhost:4000";

async function runTest(name: string, config: autocannon.Options) {
  console.log(`\n========== ${name} ==========\n`);

  const result = await autocannon({
    ...config,
  });

  console.log("Requests/sec:", result.requests.average);
  console.log("Average latency:", result.latency.average, "ms");
  console.log("P99 latency:", result.latency.p99, "ms");
  console.log("Total requests:", result.requests.total);
  console.log("Non-2xx responses:", result.non2xx);
  console.log("Errors:", result.errors);
  console.log("Timeouts:", result.timeouts);
}

// 1. GET all rooms
async function testGetRooms() {
  await runTest("GET ALL ROOMS", {
    url: BASE_URL,
    connections: 50,
    duration: 10,
    requests: [{ method: "GET", path: "/rooms" }],
  });
}

// 2. GET a specific room
async function testGetRoom() {
  await runTest("GET SINGLE ROOM", {
    url: BASE_URL,
    connections: 50,
    duration: 10,
    requests: [{ method: "GET", path: "/rooms/1" }],
  });
}

// 3. POST create room
async function testCreateRoom() {
  await runTest("CREATE ROOM", {
    url: BASE_URL,
    connections: 10,
    duration: 5,
    requests: [
      {
        method: "POST",
        path: "/rooms",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          roomId: "test-room",
          roomName: "Test Room",
        }),
      },
    ],
  });
}

// 4. PUT update room
async function testUpdateRoom() {
  await runTest("UPDATE ROOM", {
    url: BASE_URL,
    connections: 10,
    duration: 5,
    requests: [
      {
        method: "PUT",
        path: "/rooms/1",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          roomName: "Updated Room",
        }),
      },
    ],
  });
}

// 5. DELETE room
async function testDeleteRoom() {
  await runTest("DELETE ROOM", {
    url: BASE_URL,
    connections: 10,
    duration: 5,
    requests: [{ method: "DELETE", path: "/rooms/1" }],
  });
}

// 6. Concurrent booking
async function testConcurrentBooking() {
  await runTest("CONCURRENT BOOKING", {
    url: BASE_URL,
    connections: 100,
    duration: 10,
    requests: [
      {
        method: "POST",
        path: "/rooms/1/book",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          userId: "user-1",
        }),
      },
    ],
  });
}

// Execute tests individually
async function main() {
  await testGetRooms();
  await testGetRoom();
  await testCreateRoom();
  await testUpdateRoom();
  await testDeleteRoom();
  await testConcurrentBooking();
}

main().catch(console.error);
