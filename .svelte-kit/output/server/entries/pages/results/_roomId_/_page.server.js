import { error } from "@sveltejs/kit";
import { g as getRoom, a as getResults } from "../../../../chunks/roomManager.js";
async function load({ params }) {
  const room = await getRoom(params.roomId, true);
  if (!room) throw error(404, "Resultats introuvables");
  return { room: { ...room, questions: void 0 }, results: getResults(room) };
}
export {
  load
};
