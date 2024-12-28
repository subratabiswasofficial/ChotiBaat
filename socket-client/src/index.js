// Import the Socket.IO client library
const io = require("socket.io-client");

let i = 0;
const connections = [];
let intervalId = null;
let sentMessage = 0;
let receivedMessages = 0;
async function testConnections() {
  setInterval(() => {
    let idx = 0;
    connections.forEach(({ socket, index, name }) => {
      const msg = {
        from: name,
        to: `bot_${connections[connections.length - 1 - idx].index}`,
        text: "hi there from subrata",
      };
      socket.emit("message", msg, (ack) => {
        console.log("sent messages", ++sentMessage);
      });
      ++idx;
    });
  }, 1000);
}
setTimeout(() => {
  intervalId = setInterval(() => {
    console.log("trying to connect");

    // Connect to the Socket.IO server with extra headers
    const socket = io(
      `http://${process.env.SOCKET_HOST}:${process.env.SOCKET_PORT}`,
      {
        extraHeaders: {
          token: `{"user_id":"bot_${i}"}`,
        },
      }
    );

    ++i;

    // Listen for connection events
    socket.on("connect", () => {
      console.log("Connected to the server with socket ID:", socket.id);
      connections.push({ socket, index: i, name: `bot_${i}` });
    });

    socket.on("message", (data) => {
      console.log("received messages", ++receivedMessages);
    });

    if (connections.length >= 3000) {
      clearInterval(intervalId);
      console.log("Done 1000 connections");
      testConnections();
    }
  }, 10);
}, 1);
