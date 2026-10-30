import express from "express";
import cors from "cors";
import fs from "fs";

const app = express();
const port = 4000;

const log = (...args: unknown[]) =>
  console.log(`[${new Date().toISOString()}]`, ...args);

app.use(express.json());
app.use(cors());

app.use((err: any, req: any, res: any, next: any) => {
  console.log("JSON PARSE ERROR:", err);
  console.log("RAW BODY:", err.body);
  res.status(400).json({ error: err.message });
});

app.use((req, res, next) => {
  console.log("============================================");
  console.log("BODY:", req.body);
  next();
});

// log every request with its status and duration once the response is sent
app.use((req, res, next) => {
  const start = performance.now();
  res.on("finish", () => {
    const duration = (performance.now() - start).toFixed(2);
    log(
      `${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`,
    );
  });
  next();
});

// roomid => room metadata
const rooms: Map<string, { name: string; id: string }> = new Map();

// roomid => booked userId
const bookings: Map<string, string> = new Map();

const locks: Set<string> = new Set();

app.post("/rooms", (req, res) => {
  const roomId = req.body.roomId;
  const roomName = req.body.roomName;

  rooms.set(roomId, { id: roomId, name: roomName });
  log(
    `room created: id=${roomId} name=${roomName} (total rooms: ${rooms.size})`,
  );

  res.status(201).json({ message: "room created", roomId });
});

app.get("/rooms", (req, res) => {
  log(`listing rooms: count=${rooms.size}`);
  res.json({ rooms: Array.from(rooms) });
});

app.get("/rooms/:id", (req, res) => {
  const roomId = req.params.id;

  const existingRoom = rooms.get(roomId);

  if (!existingRoom) {
    log(`get room failed: room not found id=${roomId}`);
    res.json({ message: "room not found" });
    return;
  }

  log(`room fetched: id=${roomId}`);
  res.json({ room: existingRoom });
});

app.put("/rooms/:id", (req, res) => {
  const roomId = req.params.id;
  const roomName = req.body.roomName;

  const existingRoom = rooms.get(roomId);

  if (!existingRoom) {
    log(`update room failed: room not found id=${roomId}`);
    res.json({ message: "room not found" });
    return;
  }

  rooms.set(roomId, { id: roomId, name: roomName });
  log(
    `room updated: id=${roomId} name "${existingRoom.name}" -> "${roomName}"`,
  );

  res.json({ message: "room updated" });
});

app.delete("/rooms/:id", (req, res) => {
  const roomId = req.params.id;

  const deleted = rooms.delete(roomId);
  log(
    `room delete: id=${roomId} existed=${deleted} (total rooms: ${rooms.size})`,
  );

  res.json({ message: "room deleted" });
});

app.post("/rooms/:id/book", (req, res) => {
  const roomId = req.params.id;
  const userId = req.body.userId;

  log(`booking attempt: room=${roomId} user=${userId}`);

  const existingRoom = rooms.get(roomId);

  if (!existingRoom) {
    log(`booking failed: room not found id=${roomId}`);
    res.json({ message: "room not found" });
    return;
  }

  const key = `r:${roomId}`;

  if (locks.has(key)) {
    log(`booking rejected: lock held key=${key}`);
    res.json({ message: "room already booked" });
    return;
  }

  locks.add(key);

  bookings.set(roomId, userId);
  log(
    `room booked: room=${roomId} user=${userId} (total bookings: ${bookings.size})`,
  );

  res.json({ message: "room booked" });
});

app.listen(port, () => log("code is running at", port));

// setInterval(() => {
//   fs.writeFileSync("rooms.json", JSON.stringify(Array.from(rooms)));
//   fs.writeFileSync("bookings.json", JSON.stringify(Array.from(bookings)));
//   fs.writeFileSync("locks.json", JSON.stringify(Array.from(locks)));
// }, 5 * 1000);
