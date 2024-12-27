import { createClient } from "redis";

const server_id = process.env.SERVER_ID || "0";
const server_mark = `[Server ${server_id}]: `;
let serverConnected = false;

const redisClient = await createClient({
  socket: {
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || "6379",
  },
})
  .on("connect", () => {
    serverConnected = true;
    console.log(server_mark + "Redis Client connected");
  })
  .on("error", (err) => {
    serverConnected = false;
    console.log(server_mark + "Redis Client Error", err);
  })
  .connect();

const publisher = redisClient.duplicate();

const subscriber = redisClient.duplicate();

async function init() {
  await redisClient.flushAll();
  await publisher.connect();
  await subscriber.connect();
}
init();

export const setValue = async (key, value) => {
  if (serverConnected) {
    await redisClient.set(key, value);
    return true;
  }
  return false;
};

export const getValue = async (key) => {
  if (serverConnected) {
    return await redisClient.get(key);
  }
  return false;
};

export const hasValue = async (key) => {
  if (serverConnected) {
    return await redisClient.exists(key);
  }
  return false;
};

export const deleteValue = async (key) => {
  if (serverConnected) {
    return await redisClient.del(key);
  }
  return false;
};

/**
 *
 * @param {string} eventName
 * @param {string} value
 * @returns {Promise<boolean>}
 */
export const publishEvent = async (eventName, value) => {
  if (serverConnected) {
    await publisher.publish(eventName, value);
  }
  return false;
};

/**
 *
 * @param {string} eventName
 * @param {(string)=>void} callback
 * @returns {Promise<boolean>}
 */
export const subscribeEvent = (eventName, callback) => {
  if (serverConnected) {
    subscriber.subscribe(eventName, (message) => {
      callback(message);
    });
    return true;
  }
  return false;
};

/**
 *
 * @param {string} userId
 * @param {string} serverId
 * @param {string} socketId
 * @returns {Promise<boolean>}
 */
export const registerUserSession = async (userId, serverId, socketId) => {
  if (serverConnected) {
    return await setValue(`user_${userId}`, `${serverId}:${socketId}`);
  }
  return false;
};

/**
 *
 * @param {string} userId
 * @param {string} serverId
 * @param {string} socketId
 * @returns {Promise<boolean>}
 */
export const removeUserSession = async (userId) => {
  if (serverConnected) {
    return await deleteValue(`user_${userId}`);
  }
  return false;
};

/**
 *
 * @param {string} userId
 * @param {string} serverId
 * @param {string} socketId
 * @returns {Promise< {server_id: string, socket_id: string} | null>}
 */
export const getUserSession = async (userId) => {
  if (serverConnected) {
    const userExists = await hasValue(`user_${userId}`);
    if (!userExists) return null;
    const server_socket_id = await getValue(`user_${userId}`);
    if (server_socket_id != null)
      return {
        server_id: server_socket_id.split(":")[0],
        socket_id: server_socket_id.split(":")[1],
      };
    return null;
  }
  return null;
};
