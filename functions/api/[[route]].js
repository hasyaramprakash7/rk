const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

const timingSafeEqual = (a, b) => {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};

const isAuthed = (req, env) => {
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
  return timingSafeEqual(token, (env.ADMIN_TOKEN || "").trim());
};

const normPhone = (p) => String(p || "").replace(/\D/g, "").slice(-10);

const TYPES = {
  "image/jpeg": ["jpg", "image"],
  "image/png": ["png", "image"],
  "image/webp": ["webp", "image"],
  "image/avif": ["avif", "image"],
  "image/gif": ["gif", "image"],
  "video/mp4": ["mp4", "video"],
  "video/webm": ["webm", "video"],
  "video/quicktime": ["mov", "video"],
};

const MAX_BYTES = 100 * 1024 * 1024;

const sockets = new Set();
const broadcast = (payload) => {
  const msg = JSON.stringify(payload);
  for (const ws of sockets) {
    try {
      ws.send(msg);
    } catch {
      sockets.delete(ws);
    }
  }
};

export async function onRequest(context) {
  const { request: req, env } = context;
  const url = new URL(req.url);
  const path = url.pathname.replace(/\/$/, "");
  
  // Always use /api proxy for media serving so images/videos load reliably without R2 public domain issues
  const pub = "/api";

  try {
    // Live WebSocket Endpoint (/api/ws)
    if (path === "/api/ws" && req.headers.get("Upgrade") === "websocket") {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      server.accept();
      sockets.add(server);
      server.addEventListener("close", () => sockets.delete(server));
      server.addEventListener("error", () => sockets.delete(server));
      server.addEventListener("message", (ev) => {
        if (ev.data === "ping") server.send("pong");
      });
      return new Response(null, { status: 101, webSocket: client });
    }

    // Serve images & videos directly from R2 binding
    if (req.method === "GET" && (path.startsWith("/api/img/") || path.startsWith("/api/vid/"))) {
      const key = path.replace(/^\/api\//, "");
      const rangeHeader = req.headers.get("Range");
      const obj = await env.BUCKET.get(key, rangeHeader ? { range: req.headers } : undefined);
      if (!obj) return new Response("Media not found in R2", { status: 404 });

      const headers = new Headers();
      obj.writeHttpMetadata(headers);
      headers.set("Accept-Ranges", "bytes");
      headers.set("Cache-Control", "public, max-age=31536000, immutable");
      if (obj.range) {
        const { offset, length } = obj.range;
        headers.set("Content-Range", `bytes ${offset}-${offset + length - 1}/${obj.size}`);
        headers.set("Content-Length", String(length));
        return new Response(obj.body, { status: 206, headers });
      }
      headers.set("Content-Length", String(obj.size));
      return new Response(obj.body, { status: 200, headers });
    }

    // Public: Fetch all slots, rooms, projects, images, videos & dynamic chat Q&As
    if (req.method === "GET" && path === "/api/data") {
      const [slots, rooms, projects, images, chatFaqs] = await Promise.all([
        env.DB.prepare("SELECT key, label, hint, count FROM slots").all(),
        env.DB.prepare("SELECT name, grp AS 'group' FROM rooms").all(),
        env.DB.prepare("SELECT id, name FROM projects").all(),
        env.DB.prepare("SELECT id, r2_key AS key, COALESCE(media_type, 'image') AS mediaType, slot, idx, room, project, title, created FROM images ORDER BY created DESC").all(),
        env.DB.prepare("SELECT id, question, keywords, answer, sort_order FROM chat_faqs ORDER BY sort_order ASC, id ASC").all(),
      ]);

      return json({
        slots: slots.results,
        rooms: rooms.results,
        projects: projects.results,
        images: images.results.map((i) => ({ ...i, url: `${pub}/${i.key}` })),
        chatFaqs: chatFaqs.results,
      });
    }

    // Public: Upsert Lead by normalized 10-digit Phone Number (prevents duplicate leads)
    if (req.method === "POST" && path === "/api/leads") {
      const b = await req.json();
      const name = String(b.name || "").trim().slice(0, 120);
      const phone = normPhone(b.phone);
      const email = String(b.email || "").trim().slice(0, 160);
      const location = String(b.loc || "").trim().slice(0, 80);
      const service = String(b.svc || "").trim().slice(0, 120);
      if (name.length < 2 || phone.length < 10) {
        return json({ error: "Valid name and 10-digit phone number are required" }, 400);
      }

      const now = Date.now();
      const existing = await env.DB.prepare("SELECT * FROM leads WHERE phone = ? ORDER BY id DESC LIMIT 1").bind(phone).first();

      if (existing) {
        await env.DB.prepare(
          "UPDATE leads SET name = ?, email = COALESCE(NULLIF(?, ''), email), whatsapp = ?, location = COALESCE(NULLIF(?, ''), location), service = COALESCE(NULLIF(?, ''), service), created = ? WHERE id = ?"
        )
          .bind(name, email, b.wa ? 1 : 0, location, service, now, existing.id)
          .run();
      } else {
        await env.DB.prepare(
          "INSERT INTO leads (name, email, phone, whatsapp, location, service, created) VALUES (?, ?, ?, ?, ?, ?, ?)"
        )
          .bind(name, email, phone, b.wa ? 1 : 0, location, service, now)
          .run();
      }

      await env.DB.prepare("UPDATE chat_sessions SET name = ?, updated = ? WHERE phone = ?").bind(name, now, phone).run();

      return json({ ok: true, phone }, 201);
    }

    // Public: Start or resume visitor chat session unified by normalized Phone Number
    if (req.method === "POST" && path === "/api/chat/start") {
      const b = await req.json();
      const name = String(b.name || "").trim().slice(0, 120);
      const phone = normPhone(b.phone);
      if (name.length < 2 || !/^[6-9]\d{9}$/.test(phone)) {
        return json({ error: "Enter valid name and 10-digit mobile number" }, 400);
      }

      const now = Date.now();
      const existingSession = await env.DB.prepare(
        "SELECT session_id FROM chat_sessions WHERE phone = ? ORDER BY updated DESC LIMIT 1"
      )
        .bind(phone)
        .first();

      const sessionId = existingSession
        ? existingSession.session_id
        : String(b.sessionId || "chat_" + crypto.randomUUID().slice(0, 10)).trim().slice(0, 64);

      await env.DB.prepare(
        "INSERT INTO chat_sessions (session_id, name, phone, created, updated) VALUES (?, ?, ?, ?, ?) ON CONFLICT(session_id) DO UPDATE SET name = excluded.name, phone = excluded.phone, updated = excluded.updated"
      )
        .bind(sessionId, name, phone, now, now)
        .run();

      const existingLead = await env.DB.prepare("SELECT id FROM leads WHERE phone = ? LIMIT 1").bind(phone).first();
      if (existingLead) {
        await env.DB.prepare("UPDATE leads SET name = ? WHERE id = ?").bind(name, existingLead.id).run();
      } else {
        await env.DB.prepare(
          "INSERT INTO leads (name, email, phone, whatsapp, location, service, created) VALUES (?, ?, ?, ?, ?, ?, ?)"
        )
          .bind(name, "", phone, 1, "Live Chat", "Chat Enquiry", now)
          .run();
      }

      const history = await env.DB.prepare(
        "SELECT id, sender, message, created FROM chat_messages WHERE session_id = ? ORDER BY id ASC"
      )
        .bind(sessionId)
        .all();

      broadcast({ type: "session_update", sessionId });
      return json({ sessionId, name, phone, messages: history.results }, 201);
    }

    if (req.method === "GET" && path === "/api/chat/messages") {
      const sessionId = url.searchParams.get("sessionId") || "";
      if (!sessionId) return json({ messages: [] });
      const res = await env.DB.prepare(
        "SELECT id, sender, message, created FROM chat_messages WHERE session_id = ? ORDER BY id ASC"
      )
        .bind(sessionId)
        .all();
      return json({ messages: res.results });
    }

    if (req.method === "POST" && path === "/api/chat/send") {
      const b = await req.json();
      const sessionId = String(b.sessionId || "").trim().slice(0, 64);
      const message = String(b.message || "").trim().slice(0, 1500);
      const botReply = b.botReply ? String(b.botReply).trim().slice(0, 2000) : null;
      if (!sessionId || !message) return json({ error: "Session and message required" }, 400);

      const now = Date.now();
      await env.DB.prepare(
        "INSERT INTO chat_messages (session_id, sender, message, created) VALUES (?, 'user', ?, ?)"
      )
        .bind(sessionId, message, now)
        .run();

      if (botReply) {
        await env.DB.prepare(
          "INSERT INTO chat_messages (session_id, sender, message, created) VALUES (?, 'bot', ?, ?)"
        )
          .bind(sessionId, botReply, now + 1)
          .run();
      }

      await env.DB.prepare("UPDATE chat_sessions SET updated = ? WHERE session_id = ?").bind(now, sessionId).run();

      const res = await env.DB.prepare(
        "SELECT id, sender, message, created FROM chat_messages WHERE session_id = ? ORDER BY id ASC"
      )
        .bind(sessionId)
        .all();

      broadcast({ type: "new_message", sessionId });
      return json({ messages: res.results }, 201);
    }

    // Admin routes below require valid ADMIN_TOKEN
    if (!isAuthed(req, env)) return json({ error: "Unauthorized" }, 401);

    if (req.method === "GET" && path === "/api/leads") {
      const res = await env.DB.prepare("SELECT * FROM leads ORDER BY created DESC LIMIT 500").all();
      return json(res.results);
    }

    if (req.method === "DELETE" && path.startsWith("/api/leads/")) {
      const id = Number(path.split("/").pop());
      await env.DB.prepare("DELETE FROM leads WHERE id = ?").bind(id).run();
      return json({ ok: true });
    }

    if (req.method === "GET" && path === "/api/chat-threads") {
      const [sessions, messages] = await Promise.all([
        env.DB.prepare("SELECT * FROM chat_sessions ORDER BY updated DESC LIMIT 200").all(),
        env.DB.prepare("SELECT * FROM chat_messages ORDER BY id ASC LIMIT 2000").all(),
      ]);
      const bySession = {};
      for (const m of messages.results) {
        (bySession[m.session_id] = bySession[m.session_id] || []).push(m);
      }
      return json(
        sessions.results.map((s) => ({
          ...s,
          messages: bySession[s.session_id] || [],
        }))
      );
    }

    if (req.method === "POST" && path === "/api/chat-reply") {
      const b = await req.json();
      const sessionId = String(b.sessionId || "").trim();
      const message = String(b.message || "").trim().slice(0, 1500);
      if (!sessionId || !message) return json({ error: "Session and reply required" }, 400);

      const now = Date.now();
      await env.DB.prepare(
        "INSERT INTO chat_messages (session_id, sender, message, created) VALUES (?, 'admin', ?, ?)"
      )
        .bind(sessionId, message, now)
        .run();
      await env.DB.prepare("UPDATE chat_sessions SET updated = ? WHERE session_id = ?").bind(now, sessionId).run();

      broadcast({ type: "new_message", sessionId });
      return json({ ok: true }, 201);
    }

    if (req.method === "DELETE" && path.startsWith("/api/chat-threads/")) {
      const sessionId = decodeURIComponent(path.split("/").pop());
      await Promise.all([
        env.DB.prepare("DELETE FROM chat_messages WHERE session_id = ?").bind(sessionId).run(),
        env.DB.prepare("DELETE FROM chat_sessions WHERE session_id = ?").bind(sessionId).run(),
      ]);
      return json({ ok: true });
    }

    if (req.method === "POST" && path === "/api/chat-faqs") {
      const b = await req.json();
      const question = String(b.question || "").trim();
      const keywords = String(b.keywords || "").trim();
      const answer = String(b.answer || "").trim();
      if (!question || !answer) return json({ error: "Question and answer are required" }, 400);
      await env.DB.prepare(
        "INSERT INTO chat_faqs (question, keywords, answer, sort_order) VALUES (?, ?, ?, ?)"
      )
        .bind(question, keywords || question.toLowerCase(), answer, Number(b.sort_order || 0))
        .run();
      return json({ ok: true }, 201);
    }

    if (req.method === "PATCH" && path.startsWith("/api/chat-faqs/")) {
      const id = Number(path.split("/").pop());
      const b = await req.json();
      await env.DB.prepare(
        "UPDATE chat_faqs SET question = ?, keywords = ?, answer = ? WHERE id = ?"
      )
        .bind(String(b.question || "").trim(), String(b.keywords || "").trim(), String(b.answer || "").trim(), id)
        .run();
      return json({ ok: true });
    }

    if (req.method === "DELETE" && path.startsWith("/api/chat-faqs/")) {
      const id = Number(path.split("/").pop());
      await env.DB.prepare("DELETE FROM chat_faqs WHERE id = ?").bind(id).run();
      return json({ ok: true });
    }

    if (req.method === "POST" && path === "/api/images") {
      const form = await req.formData();
      const file = form.get("file");
      if (!file || typeof file === "string") return json({ error: "No file uploaded" }, 400);
      const info = TYPES[file.type];
      if (!info) return json({ error: "Unsupported format. Use JPG, PNG, WebP, MP4, WebM, or MOV." }, 400);
      if (file.size > MAX_BYTES) return json({ error: "File exceeds 100MB limit" }, 400);

      const [ext, mediaType] = info;
      const slot = form.get("slot") ? String(form.get("slot")) : null;
      const idx = form.get("idx") !== null && form.get("idx") !== "" ? Number(form.get("idx")) : null;
      const room = form.get("room") ? String(form.get("room")) : null;
      const project = form.get("project") ? String(form.get("project")) : null;
      const title = String(form.get("title") || "").trim().slice(0, 140);

      const id = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
      const folder = mediaType === "video" ? "vid" : "img";
      const key = `${folder}/${id}.${ext}`;

      await env.BUCKET.put(key, await file.arrayBuffer(), {
        httpMetadata: {
          contentType: file.type,
          cacheControl: "public, max-age=31536000, immutable",
        },
      });

      if (slot !== null && idx !== null) {
        const old = await env.DB.prepare("SELECT id, r2_key FROM images WHERE slot = ? AND idx = ?")
          .bind(slot, idx)
          .first();
        if (old) {
          await env.BUCKET.delete(old.r2_key).catch(() => {});
          await env.DB.prepare("DELETE FROM images WHERE id = ?").bind(old.id).run();
        }
      }

      const created = Date.now();
      await env.DB.prepare(
        "INSERT INTO images (id, r2_key, media_type, slot, idx, room, project, title, created) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
      )
        .bind(id, key, mediaType, slot, idx, room, project, title, created)
        .run();

      return json({ id, key, mediaType, url: `${pub}/${key}`, slot, idx, room, project, title, created }, 201);
    }

    if (req.method === "PATCH" && path.startsWith("/api/images/")) {
      const id = path.split("/").pop();
      const b = await req.json();
      if (b.room !== undefined) {
        await env.DB.prepare("UPDATE images SET room = ? WHERE id = ?").bind(String(b.room), id).run();
      }
      if (b.project !== undefined) {
        await env.DB.prepare("UPDATE images SET project = ? WHERE id = ?").bind(String(b.project), id).run();
      }
      return json({ ok: true });
    }

    if (req.method === "DELETE" && path.startsWith("/api/images/")) {
      const id = path.split("/").pop();
      const row = await env.DB.prepare("SELECT r2_key FROM images WHERE id = ?").bind(id).first();
      if (row) {
        await env.BUCKET.delete(row.r2_key).catch(() => {});
        await env.DB.prepare("DELETE FROM images WHERE id = ?").bind(id).run();
      }
      return json({ ok: true });
    }

    if (req.method === "POST" && path === "/api/rooms") {
      const { name, group } = await req.json();
      const cleanName = String(name || "").trim();
      if (!cleanName) return json({ error: "Room name required" }, 400);
      await env.DB.prepare("INSERT INTO rooms (name, grp) VALUES (?, ?)")
        .bind(cleanName, String(group || "Other").trim())
        .run();
      return json({ ok: true }, 201);
    }

    if (req.method === "PATCH" && path.startsWith("/api/rooms/")) {
      const name = decodeURIComponent(path.split("/").pop());
      const { group } = await req.json();
      await env.DB.prepare("UPDATE rooms SET grp = ? WHERE name = ?").bind(String(group), name).run();
      return json({ ok: true });
    }

    if (req.method === "DELETE" && path.startsWith("/api/rooms/")) {
      const name = decodeURIComponent(path.split("/").pop());
      const used = await env.DB.prepare("SELECT 1 FROM images WHERE room = ? LIMIT 1").bind(name).first();
      if (used) return json({ error: "Move or delete images in this category first" }, 400);
      await env.DB.prepare("DELETE FROM rooms WHERE name = ?").bind(name).run();
      return json({ ok: true });
    }

    if (req.method === "POST" && path === "/api/projects") {
      const { id, name } = await req.json();
      const cleanName = String(name || "").trim();
      if (!id || !cleanName) return json({ error: "Project ID and name required" }, 400);
      await env.DB.prepare("INSERT INTO projects (id, name) VALUES (?, ?)").bind(String(id), cleanName).run();
      return json({ ok: true }, 201);
    }

    if (req.method === "DELETE" && path.startsWith("/api/projects/")) {
      const id = decodeURIComponent(path.split("/").pop());
      const used = await env.DB.prepare("SELECT 1 FROM images WHERE project = ? LIMIT 1").bind(id).first();
      if (used) return json({ error: "Move or delete images in this project first" }, 400);
      await env.DB.prepare("DELETE FROM projects WHERE id = ?").bind(id).run();
      return json({ ok: true });
    }

    return json({ error: "Not found" }, 404);
  } catch (e) {
    return json({ error: e.message || "Internal server error" }, 500);
  }
}