/**
 *
 * @param {*} socket
 * @returns {{user_id:string} | null}
 */
export const parseUerInfoFromSocket = (socket) => {
  try {
    const { user_id } = JSON.parse(socket.handshake.headers?.token);
    return { user_id };
  } catch (error) {
    return null;
  }
};
