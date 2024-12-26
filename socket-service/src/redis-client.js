import { createClient } from "redis";

export const redisSetup = async () => {
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

  if (process.env.ID == "1") {
    const publisher = client.duplicate();
    await publisher.connect();

    let i = 0;
    while (true) {
      await publisher.publish(
        "message",
        "I have a message for you [" + i + "]"
      );
      ++i;
      if (i == 10000) {
        console.log("[DONE] 10000 Messages");
        break;
      }
    }
  } else {
    const subscriber = client.duplicate();
    await subscriber.connect();

    subscriber.subscribe("message", (data) => {
      console.log("subscriber", data);
    });
  }

  //   await client.disconnect();
};
