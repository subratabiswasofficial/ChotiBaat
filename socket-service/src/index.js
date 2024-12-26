import express from "express";
import http from "http";
import { Server } from "socket.io";
import { createClient } from "redis";
import path from "path";

async function main() {
  const app = express();
  app.use(express.static(path.join(".", "public")));
  app.get("/", (req, res) => {
    res.sendFile(path.join(".", "public", "index.html"));
  });

  const server = http.createServer(app);
  const io = new Server(server);

  const client = await createClient({
    socket: {
      host: process.env.REDIS_HOST || "localhost",
    },
  })
    .on("connect", () => {
      console.log("Redis server connected");
    })
    .on("error", (err) => console.log("Redis Client Error", err))
    .connect();

  const publisher = client.duplicate();
  await publisher.connect();
  const subscriber = client.duplicate();
  await subscriber.connect();
  const server_id = process.env.ID;

  let connections = [];

  io.on("connection", async (socket) => {
    console.log("A user connected", socket.id);
    // await client.set(`U:${socket.id}`, `S:${server_id}`);

    connections.push(socket);

    socket.on("message", async (data) => {
      await publisher.publish(`S:${server_id == "0" ? "1" : "0"}`, data);

      // connections.forEach((other_socket: { id: string; emit: any }) => {
      //   if (other_socket.id != socket.id) {
      //     other_socket.emit("message", "[message]: " + data);
      //   }
      // });
    });

    await subscriber.subscribe(`S:${server_id}`, async (data) => {
      // console.log(connections.map((socket) => socket));

      connections.forEach((other_socket) => {
        console.log(data);

        other_socket.emit(
          "message",
          `[message from server ${server_id == "0" ? "1" : "0"}]: ` + data
        );
      });
    });

    socket.on("disconnect", async () => {
      console.log("user disconnected");
      // await client.del(`U:${socket.id}`);
      connections = connections.filter((socket) => socket.connected == true);
    });
  });

  server.listen(process.env.PORT || 4000, () => {
    console.log("Server running at port", process.env.PORT || 4000);
  });
}

main();
