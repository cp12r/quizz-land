import { error } from "@sveltejs/kit";
import { g as getRoom } from "../../../../chunks/roomManager.js";
async function load({ params }) {
  const room = await getRoom(params.roomId);
  if (!room) throw error(404, "Room introuvable");
  return { room };
}
export {
  load
};
