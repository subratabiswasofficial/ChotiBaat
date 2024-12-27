import EventEmitter from "node:events";
const eventEmitter = new EventEmitter();

setInterval(() => {
  eventEmitter.emit("hi");
}, 1000);

eventEmitter.on("hi", () => {
  console.log("from event");
});
