import express from "express";
import http from "http";
import { Server } from "socket.io";
import {
  getUserSession,
  publishEvent,
  registerUserSession,
  removeUserSession,
  subscribeEvent,
} from "./redis-client/index.js";
import { parseUerInfoFromSocket } from "./util.js";

import EventEmitter from "node:events";
const eventEmitter = new EventEmitter();

const server_id = process.env.SERVER_ID || "0";
const server_mark = `[Server ${server_id}]: `;

async function main() {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server);

  const connections = {};
  const messageDeliveredMap = {};

  io.on("connection", async (socket) => {
    /* register user on redis */
    const userInfo = parseUerInfoFromSocket(socket);
    if (userInfo != null)
      await registerUserSession(userInfo.user_id, server_id, socket.id);
    else return;
    /* add socket connection */
    connections[socket.id] = socket;
    /* log connected user id */
    console.log(server_mark + "New user connected", socket.id);

    socket.on("message", async (data, cb) => {
      if (data?.to != null && data?.text != null && data?.from != null) {
        data.mid = `${Math.round(Math.random() * 100000, 0)}-${Date.now()}`;
        const messageToBePubliushed = JSON.stringify(data);
        const userSession = await getUserSession(data.to);

        if (userSession != null) {
          if (connections[userSession.socket_id] != null) {
            await connections[userSession.socket_id].emit("message", {
              from: data.from,
              text: data.text,
            });
            cb({
              status: "ok",
            });
          } else {
            await publishEvent(
              `server:${userSession.server_id}:message`,
              `${userSession.socket_id}:${messageToBePubliushed}`
            );
            let clearAckEvent = true;
            eventEmitter.on(`ack:message:${data.mid}`, () => {
              cb({
                staus: "ok",
              });
              clearAckEvent = false;
              eventEmitter.off(`ack:message:${data.mid}`, () => {});
            });
            if (clearAckEvent) {
              setTimeout(() => {
                eventEmitter.off(`ack:message:${data.mid}`, () => {});
              }, 1000);
            }
          }
        } else {
        }
      }
    });

    subscribeEvent(`server:${server_id}:message`, async (data) => {
      const receiverSocketId = data.split(":")[0];
      const receiverMessageStr = data.slice(receiverSocketId.length + 1);
      const receiverMessage = JSON.parse(receiverMessageStr);
      if (connections[receiverSocketId] != null) {
        await connections[receiverSocketId].emit("message", {
          from: receiverMessage.from,
          text: receiverMessage.text,
        });
        /* add delivery call */
        const userSession = await getUserSession(receiverMessage.from);
        if (userSession != null) {
          console.log(server_mark + "sending receiver ack");

          await publishEvent(
            `server:${userSession.server_id}:message:ack`,
            receiverMessage.mid
          );
        } else {
          /* add relay serice */
        }
      } else {
        /* add relay */
      }
    });

    subscribeEvent(`server:${server_id}:message:ack`, async (mid) => {
      messageDeliveredMap[mid] = Date.now();
      console.log(server_mark + mid);

      eventEmitter.emit(`ack:message:${mid}`);
    });

    // setInterval(() => {
    //   const currentTime = Date.now();
    //   const expiredMids = [];
    //   Object.entries(messageDeliveredMap).forEach(([mid, tstamp]) => {
    //     if (currentTime - tstamp > 2 * 1000) {
    //       expiredMids.push(mid);
    //     }
    //   });
    //   expiredMids.forEach((mid) => {
    //     console.log("Expired mid", mid);
    //     delete messageDeliveredMap[mid];
    //   });
    // }, 1000);

    socket.on("disconnect", async () => {
      if (userInfo != null) await removeUserSession(userInfo.user_id);
      /* log disconnected user id */
      console.log(server_mark + "A user disconnected", socket.id);
      /* filter connection array */
      delete connections[socket.id];
    });
  });

  server.listen(process.env.PORT || 4000, () => {
    console.log(
      server_mark + "Server running at port",
      process.env.PORT || 4000
    );
  });
}

main();
