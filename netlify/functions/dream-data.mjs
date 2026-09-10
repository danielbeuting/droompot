import { getStore } from "@netlify/blobs";

const STORE = "droompot-data";
const KEY = "main";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export default async (req) => {
  const store = getStore({ name: STORE, consistency: "strong" });

  if (req.method === "GET") {
    const data = await store.get(KEY, { type: "json" });
    return json({ data: data ?? null });
  }

  if (req.method === "PUT") {
    const expectedUser = process.env.ADMIN_USERNAME;
    const expectedPassword = process.env.ADMIN_PASSWORD;
    const user = req.headers.get("x-dream-user");
    const password = req.headers.get("x-dream-password");

    if (!expectedUser || !expectedPassword) {
      return json({ error: "Admin credentials not configured" }, 500);
    }
    if (user !== expectedUser || password !== expectedPassword) {
      return json({ error: "Unauthorized" }, 401);
    }

    const body = await req.json();
    await store.setJSON(KEY, body);
    return json({ ok: true });
  }

  return json({ error: "Method not allowed" }, 405);
};
