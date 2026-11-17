import React, { useState, useEffect, useCallback, useRef } from "react";

const ENV = (typeof import.meta !== "undefined" && import.meta.env) || {};
const isVid = item => item && (item.mediaType === "video" || /\.(mp4|webm|mov)(\?|$)/i.test(item.url || item.key || ""));
const normPhone = p => String(p || "").replace(/\D/g, "").slice(-10);

const CSS = `
.rd{font-family:Inter,system-ui,Arial,sans-serif;background:#f6f3ee;color:#2a231e;min-height:100vh;font-size:14px;overflow-x:hidden;width:100%}
.rd *{box-sizing:border-box}
.rd button{font:inherit;cursor:pointer}
.rd h1,.rd h2,.rd h3{font-family:"Noto Serif",Georgia,serif;font-weight:500;margin:0}
.rd .bar{background:#2a231e;color:#fff;padding:12px 16px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;position:sticky;top:0;z-index:20;width:100%}
.rd .bar h1{font-size:16px;letter-spacing:.1em;white-space:nowrap}
.rd .tabs{display:flex;gap:4px;margin-left:auto;margin-right:auto;flex-wrap:wrap;justify-content:center}
.rd .tab{background:transparent;border:0;color:#cdbfae;padding:6px 10px;border-radius:6px;font-size:12.5px;white-space:nowrap}
.rd .tab.on{background:#a8842f;color:#fff}
.rd .bar a,.rd .bar button.lo{color:#fff;background:none;border:1px solid #6a5d50;border-radius:6px;padding:6px 10px;text-decoration:none;font-size:12px;white-space:nowrap}
.rd .wrap{max-width:1180px;margin:0 auto;padding:16px 12px 60px;width:100%}
.rd .card{background:#fff;border:1px solid #e6dfd3;border-radius:10px;padding:16px;margin-bottom:18px;width:100%;overflow:hidden}
.rd .sub{color:#7b7167;font-size:13px;margin:4px 0 12px;word-break:break-word}
.rd .btn{background:#2a231e;color:#fff;border:0;border-radius:6px;padding:8px 14px;font-size:13px;white-space:nowrap}
.rd .btn.alt{background:#fff;color:#2a231e;border:1px solid #cfc5b8}
.rd .btn.gold{background:#a8842f}
.rd .btn.red{background:#fff;color:#b3261e;border:1px solid #e6b8b4}
.rd .btn:disabled{opacity:.5;cursor:not-allowed}
.rd input[type=text],.rd input[type=password],.rd select,.rd textarea{padding:9px 11px;border:1px solid #d6cdc0;border-radius:6px;background:#fff;font:inherit;width:100%;max-width:100%;min-width:0}
.rd .row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;width:100%}
.rd .slots{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;width:100%}
.rd .cell{border:1px dashed #cfc5b8;border-radius:8px;overflow:hidden;background:#faf8f4;display:flex;flex-direction:column}
.rd .cell .th{height:110px;background:#ece6db center/cover;display:grid;place-items:center;color:#9a8f82;font-size:11px;position:relative;overflow:hidden;text-align:center;padding:4px}
.rd .cell .th video{width:100%;height:100%;object-fit:cover;display:block}
.rd .vtag{position:absolute;top:6px;left:6px;background:rgba(42,35,30,.85);color:#fff;font-size:9px;padding:2px 5px;border-radius:4px;letter-spacing:.06em}
.rd .cell .ct{padding:8px;display:flex;flex-direction:column;gap:6px;font-size:12px}
.rd .cell .ct .row{gap:4px}
.rd .cell .btn{padding:5px 8px;font-size:11px}
.rd .gal{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;width:100%}
.rd .gi{background:#fff;border:1px solid #e6dfd3;border-radius:8px;overflow:hidden;position:relative}
.rd .gi img,.rd .gi video{width:100%;height:130px;object-fit:cover;display:block}
.rd .gi .ct{padding:8px;font-size:12px;display:flex;flex-direction:column;gap:6px}
.rd .drop{border:2px dashed #b9a98c;border-radius:10px;padding:20px 14px;text-align:center;background:#fbf9f4;color:#6f6458;width:100%}
.rd .drop.on{background:#f1e8d3;border-color:#a8842f}
.rd .tbl-wrap{width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;margin-top:8px}
.rd table{width:100%;min-width:540px;border-collapse:collapse}
.rd th,.rd td{text-align:left;padding:9px 8px;border-bottom:1px solid #eee7da;vertical-align:middle;font-size:13px}
.rd th{font-size:11px;letter-spacing:.08em;color:#7b7167;text-transform:uppercase;background:#faf8f4}
.rd .toast{position:fixed;bottom:16px;left:50%;transform:translateX(-50%);background:#2a231e;color:#fff;padding:10px 16px;border-radius:8px;z-index:50;box-shadow:0 6px 24px rgba(0,0,0,.3);font-size:13px;max-width:90%;text-align:center}
.rd .toast.err{background:#b3261e}
.rd .login{max-width:360px;width:calc(100% - 24px);margin:12vh auto;background:#fff;border:1px solid #e6dfd3;border-radius:12px;padding:24px}
.rd .pill{display:inline-block;background:#efe7d6;border-radius:20px;padding:2px 8px;font-size:11px;margin-left:6px;vertical-align:middle}
.rd .cbadge{display:inline-block;background:#a8842f;color:#fff;border:0;border-radius:14px;padding:3px 8px;font-size:11px;font-weight:500;white-space:nowrap}
.rd .prog{height:6px;background:#eee;border-radius:3px;overflow:hidden;margin-top:10px;width:100%}
.rd .prog i{display:block;height:100%;background:#a8842f;transition:width .2s}

/* Live Two-Way Admin Chat Inbox */
.rd .cinbox{display:grid;grid-template-columns:260px 1fr;border:1px solid #e6dfd3;border-radius:10px;overflow:hidden;background:#fff;min-height:420px;width:100%}
.rd .clist{border-right:1px solid #e6dfd3;background:#faf8f4;overflow-y:auto;max-height:520px}
.rd .citem{padding:11px 12px;border-bottom:1px solid #eee7da;cursor:pointer}
.rd .citem.on{background:#efe7d6;border-left:3px solid #a8842f}
.rd .citem small{display:block;color:#7b7167;font-size:11.5px;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rd .cview{display:flex;flex-direction:column;height:520px;background:#fff;min-width:0}
.rd .chead{padding:10px 14px;border-bottom:1px solid #e6dfd3;display:flex;justify-content:space-between;align-items:center;gap:8px;background:#fff;flex-wrap:wrap}
.rd .lmeta{display:flex;gap:6px;flex-wrap:wrap;margin-top:4px}
.rd .ltag{background:#f3ede2;color:#5c5146;font-size:10.5px;padding:2px 6px;border-radius:4px}
.rd .cmsgs{flex:1;overflow-y:auto;padding:14px;background:#f7f4ef;display:flex;flex-direction:column;gap:8px}
.rd .cm{max-width:85%;padding:8px 11px;border-radius:10px;font-size:12.5px;line-height:1.4;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.06);word-break:break-word}
.rd .cm.bot{background:#efe9dd;color:#4a4037}
.rd .cm.admin{background:#2a231e;color:#fff;margin-left:auto}
.rd .cm span{display:block;font-size:9.5px;opacity:.65;margin-bottom:3px}
.rd .csend{display:flex;gap:6px;padding:8px 10px;border-top:1px solid #e6dfd3;background:#fff}
.rd .csend input{flex:1}

@media(max-width:768px){
  .rd .bar{padding:10px 12px;gap:8px}
  .rd .tabs{margin-left:0;width:100%;justify-content:flex-start}
  .rd .cinbox{grid-template-columns:1fr}
  .rd .clist{max-height:160px;border-right:0;border-bottom:1px solid #e6dfd3}
  .rd .cview{height:420px}
  .rd .slots{grid-template-columns:repeat(auto-fill,minmax(120px,1fr))}
  .rd .gal{grid-template-columns:repeat(auto-fill,minmax(135px,1fr))}
}
`;

async function shrink(file, max = 2000, q = 0.86) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
  try {
    const bmp = await createImageBitmap(file); const s = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas"); c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
    c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise(r => c.toBlob(r, "image/webp", q));
    return blob && blob.size < file.size ? new File([blob], file.name.replace(/\.\w+$/, "") + ".webp", { type: "image/webp" }) : file;
  } catch { return file; }
}

const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24) || "p";

export default function RKDashboard({ siteUrl = "/" }) {
  const API = (ENV.VITE_API_URL || "").replace(/\/$/, "");

  const [token, setToken] = useState(() => { try { return sessionStorage.getItem("rk_token") || ""; } catch { return ""; } });
  const [pw, setPw] = useState(""); const [data, setData] = useState(null); const [leads, setLeads] = useState([]);
  const [threads, setThreads] = useState([]); const [activeSid, setActiveSid] = useState(""); const [replyText, setReplyText] = useState("");
  const [tab, setTab] = useState("slots"); const [toast, setToast] = useState(null); const [busy, setBusy] = useState(false);
  const [prog, setProg] = useState(null); const [optimize, setOptimize] = useState(true);
  const [room, setRoom] = useState(""); const [project, setProject] = useState(""); const [title, setTitle] = useState("");
  const [fRoom, setFRoom] = useState("All"); const [fProj, setFProj] = useState("All"); const [drag, setDrag] = useState(false);
  const [newRoom, setNewRoom] = useState(""); const [newGroup, setNewGroup] = useState(""); const [newProj, setNewProj] = useState("");

  const [faqQ, setFaqQ] = useState("");
  const [faqKw, setFaqKw] = useState("");
  const [faqAns, setFaqAns] = useState("");
  const [editFaq, setEditFaq] = useState(null);

  const fileRef = useRef(null);
  const adminMsgsRef = useRef(null);

  const say = (msg, err) => { setToast({ msg, err }); setTimeout(() => setToast(null), 3200); };

  const apiFetch = useCallback(async (path, opts = {}, authTok = token) => {
    const headers = { ...(opts.headers || {}), Authorization: `Bearer ${authTok}` };
    const res = await fetch(`${API}${path}`, { ...opts, headers });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
    return body;
  }, [API, token]);

  const reload = useCallback(async (authTok = token) => {
    const [d, l, t] = await Promise.all([
      fetch(`${API}/api/data?t=${Date.now()}`, { cache: "no-store" }).then(r => r.json()),
      apiFetch("/api/leads", {}, authTok),
      apiFetch("/api/chat-threads", {}, authTok),
    ]);
    setData(d);
    setLeads(l);
    setThreads(t);
    setActiveSid(prev => prev && t.some(x => x.session_id === prev) ? prev : (t[0]?.session_id || ""));
  }, [API, apiFetch, token]);

  const logout = () => { try { sessionStorage.removeItem("rk_token"); } catch {} setToken(""); setData(null); };
  const login = async e => {
    e.preventDefault();
    try {
      await reload(pw);
      try { sessionStorage.setItem("rk_token", pw); } catch {}
      setToken(pw); setPw("");
    } catch {
      say("Wrong admin token", true);
    }
  };

  useEffect(() => { if (token) reload().catch(() => logout()); }, [token, reload]);
  useEffect(() => { if (data) { if (!room && data.rooms[0]) setRoom(data.rooms[0].name); if (!project && data.projects[0]) setProject(data.projects[0].id); } }, [data, room, project]);

  useEffect(() => {
    if (!token || (tab !== "chat" && tab !== "leads")) return;
    let ws;
    try {
      const base = API ? new URL(API, window.location.origin) : new URL(window.location.origin);
      const proto = base.protocol === "https:" ? "wss:" : "ws:";
      ws = new WebSocket(`${proto}//${base.host}/api/ws`);
      ws.onmessage = () => reload().catch(() => {});
    } catch {}
    const poll = setInterval(() => reload().catch(() => {}), 4000);
    return () => {
      clearInterval(poll);
      if (ws) try { ws.close(); } catch {}
    };
  }, [token, tab, API, reload]);

  useEffect(() => {
    if (adminMsgsRef.current) adminMsgsRef.current.scrollTop = adminMsgsRef.current.scrollHeight;
  }, [threads, activeSid, tab]);

  const uploadOne = async (file, fields) => {
    const isVideo = file.type.startsWith("video/");
    const f = (!isVideo && optimize) ? await shrink(file) : file;
    const fd = new FormData();
    fd.append("file", f);
    Object.entries(fields).forEach(([k, v]) => { if (v !== undefined && v !== null) fd.append(k, String(v)); });
    return apiFetch("/api/images", { method: "POST", body: fd });
  };

  const uploadSlot = async (slot, idx, file) => {
    if (!file) return; setBusy(true);
    try {
      await uploadOne(file, { slot, idx });
      await reload();
      say(file.type.startsWith("video/") ? "Top banner video saved" : "Image saved to R2 & D1 SQL");
    } catch (e) { say(e.message, true); }
    setBusy(false);
  };

  const uploadMany = async files => {
    const list = [...files].filter(f => f.type.startsWith("image/") || f.type.startsWith("video/"));
    if (!list.length) return say("Choose image or video files", true);
    if (!room || !project) return say("Create a room category and a project first", true);
    setBusy(true); let ok = 0;
    for (let i = 0; i < list.length; i++) {
      setProg({ i: i + 1, n: list.length });
      try { await uploadOne(list[i], { room, project, title: title.trim() }); ok++; } catch (e) { say(`${list[i].name}: ${e.message}`, true); }
    }
    await reload();
    setProg(null); setBusy(false); say(`${ok} of ${list.length} uploaded`); setTitle("");
  };

  const del = async id => {
    if (!confirm("Delete this media permanently from R2 & SQL?")) return;
    try {
      await apiFetch(`/api/images/${id}`, { method: "DELETE" });
      await reload();
      say("Deleted");
    } catch (e) { say(e.message, true); }
  };

  const move = async (id, patch) => {
    try {
      await apiFetch(`/api/images/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
      await reload();
      say("Updated");
    } catch (e) { say(e.message, true); }
  };

  const sendAdminReply = async e => {
    e.preventDefault();
    if (!activeSid || !replyText.trim()) return;
    const msg = replyText.trim();
    setReplyText("");
    try {
      await apiFetch("/api/chat-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: activeSid, message: msg }),
      });
      await reload();
    } catch (err) { say(err.message, true); }
  };

  const saveFaq = async e => {
    e.preventDefault();
    if (!faqQ.trim() || !faqAns.trim()) return say("Enter both question and answer", true);
    try {
      if (editFaq) {
        await apiFetch(`/api/chat-faqs/${editFaq.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: faqQ, keywords: faqKw, answer: faqAns }),
        });
        setEditFaq(null);
        say("Chat Q&A updated");
      } else {
        await apiFetch("/api/chat-faqs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: faqQ, keywords: faqKw, answer: faqAns }),
        });
        say("Chat Q&A added");
      }
      setFaqQ(""); setFaqKw(""); setFaqAns("");
      await reload();
    } catch (err) { say(err.message, true); }
  };

  if (!token) return (
    <div className="rd"><style>{CSS}</style><form className="login" onSubmit={login}>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>RK Interior Studio</h1><p className="sub">Admin dashboard — enter your admin token</p>
      <input type="password" placeholder="ADMIN_TOKEN" value={pw} onChange={e => setPw(e.target.value)} style={{ width: "100%", marginBottom: 12 }} autoFocus />
      <button className="btn gold" style={{ width: "100%" }} disabled={!pw}>Sign in</button>
    </form>{toast && <div className={"toast" + (toast.err ? " err" : "")}>{toast.msg}</div>}</div>
  );
  if (!data) return <div className="rd"><style>{CSS}</style><p style={{ padding: 40, textAlign: "center" }}>Loading from D1 SQL…</p>{toast && <div className="toast err">{toast.msg}</div>}</div>;

  const slotImg = (k, i) => data.images.find(x => x.slot === k && x.idx === i);
  const gallery = data.images.filter(x => !x.slot);
  const shown = gallery.filter(g => (fRoom === "All" || g.room === fRoom) && (fProj === "All" || g.project === fProj)).sort((a, b) => (b.created || 0) - (a.created || 0));
  const groups = [...new Set(data.rooms.map(r => r.group))];
  const chatFaqs = data.chatFaqs || [];

  const threadByPhone = Object.fromEntries(threads.map(t => [normPhone(t.phone), t]));
  const leadByPhone = Object.fromEntries(leads.map(l => [normPhone(l.phone), l]));

  const unifiedLeads = Object.values(
    leads.reduce((acc, l) => {
      const p = normPhone(l.phone) || String(l.id);
      if (!acc[p]) {
        acc[p] = { ...l, phone: normPhone(l.phone) || l.phone };
      } else {
        acc[p] = {
          ...acc[p],
          name: l.name || acc[p].name,
          email: l.email || acc[p].email,
          location: (l.location && l.location !== "Live Chat") ? l.location : acc[p].location,
          service: (l.service && l.service !== "Chat Enquiry") ? l.service : acc[p].service,
          created: Math.max(acc[p].created || 0, l.created || 0),
        };
      }
      return acc;
    }, {})
  ).sort((a, b) => (b.created || 0) - (a.created || 0));

  const activeThread = threads.find(t => t.session_id === activeSid);
  const activeLead = activeThread ? leadByPhone[normPhone(activeThread.phone)] : null;

  return (
    <div className="rd"><style>{CSS}</style>
      <div className="bar"><h1>RK ADMIN</h1>
        <div className="tabs">{[["slots", "Site Media"], ["gallery", "Gallery"], ["cats", "Categories"], ["leads", `Leads (${unifiedLeads.length})`], ["chat", `Live Chat (${threads.length})`]].map(([k, l]) => <button key={k} className={"tab" + (tab === k ? " on" : "")} onClick={() => setTab(k)}>{l}</button>)}</div>
        <span style={{ flex: 1 }} /><a href={siteUrl} target="_blank" rel="noreferrer">View site ↗</a><button className="lo" onClick={logout}>Sign out</button></div>
      <div className="wrap">

        {tab === "slots" && <>
          <p className="sub">Manage all fixed banners & images. The <b>Top Hero Banner</b> accepts both <b>MP4/WebM videos</b> and high-res photos.</p>
          {data.slots.map(s => {
            const allowVideo = s.key === "hero";
            return (
              <div className="card" key={s.key}>
                <h3 style={{ fontSize: 17 }}>{s.key === "hero" ? "Top Hero Banner (Image or Video)" : s.label}<span className="pill">{data.images.filter(x => x.slot === s.key).length}/{s.count}</span></h3>
                <p className="sub">{allowVideo ? "Upload MP4 / WebM / MOV videos or wide 16:9 images for the top hero banner." : s.hint}</p>
                <div className="slots">{Array.from({ length: s.count }, (_, i) => {
                  const im = slotImg(s.key, i);
                  const video = isVid(im);
                  return (
                    <div className="cell" key={i}>
                      <div className="th" style={!video && im ? { backgroundImage: `url(${im.url})` } : {}}>
                        {video && <><video src={im.url} muted loop playsInline onMouseEnter={e => e.target.play()} onMouseLeave={e => e.target.pause()} /><span className="vtag">VIDEO</span></>}
                        {!im && `${allowVideo ? "Slide / Video" : s.key} #${i + 1} – empty`}
                      </div>
                      <div className="ct"><b>#{i + 1} {video ? "(Video)" : ""}</b><div className="row">
                        <label className="btn gold" style={{ cursor: "pointer", padding: "5px 8px", fontSize: 11, textAlign: "center", flex: 1 }}>
                          {im ? "Replace" : (allowVideo ? "Upload Media" : "Upload")}
                          <input type="file" accept={allowVideo ? "image/*,video/mp4,video/webm,video/quicktime" : "image/*"} hidden disabled={busy} onChange={e => { uploadSlot(s.key, i, e.target.files[0]); e.target.value = ""; }} />
                        </label>
                        {im && <button className="btn red" onClick={() => del(im.id)}>Delete</button>}
                      </div></div>
                    </div>
                  );
                })}</div>
              </div>
            );
          })}
        </>}

        {tab === "gallery" && <>
          <div className="card"><h3>Upload designs & walkthrough videos</h3><p className="sub">Choose a room category and project, then drop images or walkthrough videos (MP4/WebM).</p>
            <div className="row" style={{ marginBottom: 12 }}>
              <select value={room} onChange={e => setRoom(e.target.value)} style={{ flex: 1, minWidth: 130 }}>{data.rooms.map(r => <option key={r.name}>{r.name}</option>)}</select>
              <select value={project} onChange={e => setProject(e.target.value)} style={{ flex: 1, minWidth: 130 }}>{data.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
              <input type="text" placeholder="Title (optional)" value={title} onChange={e => setTitle(e.target.value)} style={{ flex: 2, minWidth: 160 }} />
            </div>
            <div className="row" style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}><input type="checkbox" checked={optimize} onChange={e => setOptimize(e.target.checked)} /> Optimise images (max 2000px, WebP)</label>
            </div>
            <div className={"drop" + (drag ? " on" : "")} onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={e => { e.preventDefault(); setDrag(false); uploadMany(e.dataTransfer.files); }}>
              <p style={{ margin: "0 0 10px" }}>Drag & drop images or videos here</p>
              <button className="btn gold" disabled={busy} onClick={() => fileRef.current.click()}>Choose files</button>
              <input ref={fileRef} type="file" accept="image/*,video/mp4,video/webm,video/quicktime" multiple hidden onChange={e => { uploadMany(e.target.files); e.target.value = ""; }} />
              {prog && <><p style={{ margin: "12px 0 0" }}>Uploading {prog.i} / {prog.n}…</p><div className="prog"><i style={{ width: (prog.i / prog.n * 100) + "%" }} /></div></>}</div></div>
          <div className="card"><div className="row" style={{ marginBottom: 14 }}><h3 style={{ fontSize: 17 }}>Gallery media<span className="pill">{shown.length}</span></h3><span style={{ flex: 1 }} />
            <select value={fRoom} onChange={e => setFRoom(e.target.value)} style={{ width: "auto" }}><option>All</option>{data.rooms.map(r => <option key={r.name}>{r.name}</option>)}</select>
            <select value={fProj} onChange={e => setFProj(e.target.value)} style={{ width: "auto" }}><option value="All">All projects</option>{data.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            {shown.length === 0 ? <p className="sub">No media yet.</p> : <div className="gal">{shown.map(g => {
              const video = isVid(g);
              return (
                <div className="gi" key={g.id}>
                  {video ? <><video src={g.url} muted loop playsInline onMouseEnter={e => e.target.play()} onMouseLeave={e => e.target.pause()} /><span className="vtag">VIDEO</span></> : <img src={g.url} alt="" loading="lazy" />}
                  <div className="ct"><b>{g.title || "Untitled"}</b>
                    <select value={g.room} onChange={e => move(g.id, { room: e.target.value })}>{data.rooms.map(r => <option key={r.name}>{r.name}</option>)}</select>
                    <select value={g.project} onChange={e => move(g.id, { project: e.target.value })}>{data.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                    <button className="btn red" onClick={() => del(g.id)}>Delete</button>
                  </div>
                </div>
              );
            })}</div>}</div></>}

        {tab === "cats" && <>
          <div className="card"><h3>Room categories<span className="pill">{data.rooms.length}</span></h3><p className="sub">Stored in the SQL `rooms` table.</p>
            <div className="tbl-wrap"><table><thead><tr><th>Name</th><th>Menu group</th><th>Items</th><th /></tr></thead><tbody>{data.rooms.map(r => (
              <tr key={r.name}><td>{r.name}</td><td><select value={r.group} onChange={e => apiFetch(`/api/rooms/${encodeURIComponent(r.name)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ group: e.target.value }) }).then(() => reload())}>{groups.map(g => <option key={g}>{g}</option>)}</select></td>
                <td>{gallery.filter(g => g.room === r.name).length}</td><td><button className="btn red" onClick={() => {
                  if (confirm(`Delete “${r.name}”?`)) apiFetch(`/api/rooms/${encodeURIComponent(r.name)}`, { method: "DELETE" }).then(() => { reload(); say("Deleted"); }).catch(e => say(e.message, true));
                }}>Delete</button></td></tr>))}</tbody></table></div>
            <div className="row" style={{ marginTop: 14 }}><input type="text" placeholder="New category (e.g. Balcony)" value={newRoom} onChange={e => setNewRoom(e.target.value)} style={{ flex: 2, minWidth: 140 }} />
              <input type="text" list="grp" placeholder="Menu group" value={newGroup} onChange={e => setNewGroup(e.target.value)} style={{ flex: 2, minWidth: 140 }} /><datalist id="grp">{groups.map(g => <option key={g} value={g} />)}</datalist>
              <button className="btn gold" disabled={!newRoom.trim()} onClick={() => {
                apiFetch("/api/rooms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newRoom.trim(), group: newGroup.trim() || "Other" }) }).then(() => { setNewRoom(""); reload(); say("Category added"); }).catch(e => say(e.message, true));
              }}>Add category</button></div></div>
          <div className="card"><h3>Projects<span className="pill">{data.projects.length}</span></h3><p className="sub">Stored in the SQL `projects` table.</p>
            <div className="tbl-wrap"><table><thead><tr><th>Name</th><th>Items</th><th /></tr></thead><tbody>{data.projects.map(p => (
              <tr key={p.id}><td>{p.name}</td><td>{gallery.filter(g => g.project === p.id).length}</td><td><button className="btn red" onClick={() => {
                if (confirm(`Delete “${p.name}”?`)) apiFetch(`/api/projects/${encodeURIComponent(p.id)}`, { method: "DELETE" }).then(() => { reload(); say("Deleted"); }).catch(e => say(e.message, true));
              }}>Delete</button></td></tr>))}</tbody></table></div>
            <div className="row" style={{ marginTop: 14 }}><input type="text" placeholder="New project name" value={newProj} onChange={e => setNewProj(e.target.value)} style={{ flex: 3, minWidth: 160 }} />
              <button className="btn gold" disabled={!newProj.trim()} onClick={() => {
                const name = newProj.trim();
                let id = slug(name); while (data.projects.some(p => p.id === id)) id += Math.floor(Math.random() * 10);
                apiFetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, name }) }).then(() => { setNewProj(""); reload(); say("Project added"); }).catch(e => say(e.message, true));
              }}>Add project</button></div></div></>}

        {tab === "leads" && <div className="card"><h3>Unified Customer Leads<span className="pill">{unifiedLeads.length}</span></h3><p className="sub">Form submissions and Live Chat enquiries with the same mobile number are automatically combined.</p>
          {unifiedLeads.length === 0 ? <p className="sub">No enquiries yet.</p> : <div className="tbl-wrap"><table><thead><tr><th>Date</th><th>Name</th><th>Phone</th><th>Email</th><th>Location</th><th>Service</th><th>Chat</th><th /></tr></thead><tbody>
            {unifiedLeads.map(l => {
              const linkedChat = threadByPhone[normPhone(l.phone)];
              return (
                <tr key={l.id}>
                  <td>{new Date(l.created).toLocaleDateString()}</td>
                  <td><b>{l.name}</b></td>
                  <td><a href={`tel:${l.phone}`}>{l.phone}</a></td>
                  <td>{l.email || "—"}</td>
                  <td>{l.location || "—"}</td>
                  <td>{l.service || "—"}</td>
                  <td>
                    {linkedChat ? (
                      <button className="cbadge" onClick={() => { setActiveSid(linkedChat.session_id); setTab("chat"); }}>
                        View Chat ({linkedChat.messages.length})
                      </button>
                    ) : <span style={{ color: "#999", fontSize: 12 }}>—</span>}
                  </td>
                  <td><button className="btn red" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => apiFetch(`/api/leads/${l.id}`, { method: "DELETE" }).then(() => reload())}>Delete</button></td>
                </tr>
              );
            })}
          </tbody></table></div>}</div>}

        {tab === "chat" && <>
          <div className="card">
            <div className="row" style={{ marginBottom: 12 }}>
              <h3 style={{ fontSize: 17 }}>Visitor Live Chat Conversations<span className="pill">{threads.length}</span></h3>
              <span style={{ flex: 1 }} />
              <button className="btn alt" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => reload()}>Refresh</button>
            </div>
            <p className="sub">Combined with customer form details by mobile number. Click a visitor below to view their full history and reply live.</p>

            {threads.length === 0 ? <p className="sub">No visitor chats yet.</p> : (
              <div className="cinbox">
                <div className="clist">
                  {threads.map(t => {
                    const last = t.messages[t.messages.length - 1];
                    const lInfo = leadByPhone[normPhone(t.phone)];
                    return (
                      <div key={t.session_id} className={"citem" + (activeSid === t.session_id ? " on" : "")} onClick={() => setActiveSid(t.session_id)}>
                        <b>{lInfo?.name || t.name}</b> · <a href={`tel:${t.phone}`} onClick={e => e.stopPropagation()} style={{ color: "#a8842f", fontWeight: 600 }}>{t.phone}</a>
                        {lInfo?.location && lInfo.location !== "Live Chat" && <small style={{ color: "#2a231e" }}>{lInfo.location}{lInfo.service ? ` · ${lInfo.service}` : ""}</small>}
                        <small>{last ? `${last.sender === "user" ? "" : "Reply: "}${last.message.slice(0, 48)}` : "Started chat"}</small>
                        <small style={{ fontSize: 10 }}>{new Date(t.updated).toLocaleString()}</small>
                      </div>
                    );
                  })}
                </div>

                {activeThread && (
                  <div className="cview">
                    <div className="chead">
                      <div>
                        <b style={{ fontSize: 13.5 }}>{activeLead?.name || activeThread.name}</b> · <a href={`tel:${activeThread.phone}`} style={{ fontSize: 13 }}>{activeThread.phone}</a>
                        {activeLead && (activeLead.email || (activeLead.location && activeLead.location !== "Live Chat") || (activeLead.service && activeLead.service !== "Chat Enquiry")) && (
                          <div className="lmeta">
                            {activeLead.email && <span className="ltag">✉️ {activeLead.email}</span>}
                            {activeLead.location && activeLead.location !== "Live Chat" && <span className="ltag">📍 {activeLead.location}</span>}
                            {activeLead.service && activeLead.service !== "Chat Enquiry" && <span className="ltag">🛠️ {activeLead.service}</span>}
                          </div>
                        )}
                      </div>
                      <button className="btn red" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => {
                        if (confirm(`Delete chat with ${activeLead?.name || activeThread.name}?`)) apiFetch(`/api/chat-threads/${encodeURIComponent(activeThread.session_id)}`, { method: "DELETE" }).then(() => reload());
                      }}>Delete Thread</button>
                    </div>
                    <div className="cmsgs" ref={adminMsgsRef}>
                      {activeThread.messages.length === 0 && <p className="sub">Visitor joined chat. Waiting for their first message…</p>}
                      {activeThread.messages.map(m => (
                        <div key={m.id} className={"cm " + m.sender}>
                          <span>{m.sender === "user" ? (activeLead?.name || activeThread.name) : m.sender === "admin" ? "You (Admin)" : "Auto-Answer"} · {new Date(m.created).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                          {m.message}
                        </div>
                      ))}
                    </div>
                    <form className="csend" onSubmit={sendAdminReply}>
                      <input type="text" placeholder={`Reply to ${activeLead?.name || activeThread.name}...`} value={replyText} onChange={e => setReplyText(e.target.value)} />
                      <button type="submit" className="btn gold">Send</button>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="card">
            <h3>Quick-Tap Auto-Answer Q&As<span className="pill">{chatFaqs.length}</span></h3>
            <p className="sub">Optional instant-answer buttons shown inside the visitor chat bubble.</p>
            <form onSubmit={saveFaq} style={{ display: "grid", gap: 8, marginBottom: 16 }}>
              <div className="row">
                <input type="text" placeholder="Question button label" value={faqQ} onChange={e => setFaqQ(e.target.value)} style={{ flex: 2, minWidth: 140 }} />
                <input type="text" placeholder="Keywords (comma-separated)" value={faqKw} onChange={e => setFaqKw(e.target.value)} style={{ flex: 2, minWidth: 140 }} />
              </div>
              <textarea rows={2} placeholder="Auto-answer..." value={faqAns} onChange={e => setFaqAns(e.target.value)} style={{ width: "100%" }} />
              <div className="row">
                <button type="submit" className="btn gold">{editFaq ? "Update Q&A" : "Add Q&A"}</button>
                {editFaq && <button type="button" className="btn alt" onClick={() => { setEditFaq(null); setFaqQ(""); setFaqKw(""); setFaqAns(""); }}>Cancel</button>}
              </div>
            </form>
            <div className="tbl-wrap"><table>
              <thead><tr><th>Quick Question</th><th>Keywords</th><th>Auto-Answer</th><th /></tr></thead>
              <tbody>
                {chatFaqs.map(f => (
                  <tr key={f.id}>
                    <td><b>{f.question}</b></td>
                    <td style={{ color: "#7b7167", fontSize: 12 }}>{f.keywords}</td>
                    <td>{f.answer}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <button className="btn alt" style={{ padding: "4px 8px", fontSize: 11, marginRight: 4 }} onClick={() => { setEditFaq(f); setFaqQ(f.question); setFaqKw(f.keywords); setFaqAns(f.answer); }}>Edit</button>
                      <button className="btn red" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => apiFetch(`/api/chat-faqs/${f.id}`, { method: "DELETE" }).then(() => { reload(); say("Deleted"); })}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>
        </>}
      </div>
      {toast && <div className={"toast" + (toast.err ? " err" : "")}>{toast.msg}</div>}
    </div>
  );
}