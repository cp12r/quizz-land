import { json } from "@sveltejs/kit";
import { c as createRoom } from "../../../../chunks/roomManager.js";
import { r as rateLimit } from "../../../../chunks/rateLimit.js";
async function POST({ request, getClientAddress }) {
  if (!rateLimit(`create:${getClientAddress()}`, 10)) {
    return json({ message: "Trop de creations de rooms. Reessaie dans une minute." }, { status: 429 });
  }
  const config = await request.json();
  const room = await createRoom(config);
  return json({ room });
}
export {
  POST
};
