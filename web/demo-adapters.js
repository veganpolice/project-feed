// In-memory stand-ins for the page's `mcp` and `db` capabilities, used only by the demo build (web/build.py).
// They answer the same calls the live page makes, with the same result shapes, so the demo runs the real page code.
// Nothing persists: a reload starts from DEMO again.
function makeDemoAdapters(DEMO) {
  const OPEN = ["To Do", "In Progress", "Blocked"];
  const tasks = DEMO.tasks.map(r => Object.assign({}, r));
  const projects = DEMO.projects.map(r => Object.assign({}, r));
  const views = (DEMO.workspace && DEMO.workspace.views) || {};
  const watchers = new Set();
  let nextId = 1;

  function rowsFor(viewUrl) {
    const u = String(viewUrl || "");
    if (views.projects && u.endsWith(views.projects)) return projects;
    if (views.triage && u.endsWith(views.triage)) return tasks.filter(r => r.Status === "Triage");
    if (views.open && u.endsWith(views.open)) return tasks.filter(r => OPEN.includes(r.Status));
    return [];
  }
  function result(input) {
    const rows = rowsFor(input && input.data && input.data.view_url).map(r => Object.assign({}, r));
    return { payload: { results: rows, has_more: false }, cache: { storedAt: Date.now() } };
  }
  function emitAll() {
    watchers.forEach(w => setTimeout(() => { if (watchers.has(w)) w.handler({ type: "data", result: result(w.input) }); }, 0));
  }
  function idOf(pageId) {
    return tasks.find(r => String(r.url).replace(/-/g, "").includes(String(pageId).replace(/-/g, "")));
  }
  function fakeUrl() {
    const hex = (Date.now().toString(16) + (nextId++).toString(16)).padStart(32, "0").slice(-32);
    return "https://www.notion.so/demo-" + hex;
  }

  const mcp = {
    watchTool(server, tool, input, handler) {
      const w = { input, handler };
      watchers.add(w);
      setTimeout(() => { if (watchers.has(w)) handler({ type: "data", result: result(input) }); }, 0);
      return () => watchers.delete(w);
    },
    async callTool(server, tool, args) {
      if (tool === "notion-update-page") {
        const row = idOf(args.page_id);
        if (!row) throw { code: "tool_error", message: "No such page in the demo." };
        Object.assign(row, args.properties || {});
        emitAll();
        return { payload: { id: args.page_id } };
      }
      if (tool === "notion-create-pages") {
        const made = (args.pages || []).map(p => {
          const row = Object.assign({ Status: "To Do", Priority: "Medium", Project: "[]" }, p.properties, { url: fakeUrl() });
          tasks.push(row);
          return row.url;
        });
        emitAll();
        return { payload: { pages: made } };
      }
      if (tool === "notion-query-data-sources") return result(args);
      throw { code: "tool_error", message: "The demo doesn't support " + tool + "." };
    },
    async invalidate() { emitAll(); },
  };

  // db: documents in a Map keyed by path; collections are the docs one segment below a name.
  const docs = new Map(Object.entries(DEMO.db || {}));
  const docListeners = new Map();   // path -> Set(fn)
  const colListeners = new Map();   // name -> Set(fn)
  function docSnap(path) {
    const has = docs.has(path);
    return { exists: has, id: path.split("/").pop(), data: () => (has ? JSON.parse(JSON.stringify(docs.get(path))) : undefined) };
  }
  function colSnap(name) {
    const out = [];
    docs.forEach((v, k) => { const parts = k.split("/"); if (parts.length === 2 && parts[0] === name) out.push(docSnap(k)); });
    return { docs: out, size: out.length, empty: !out.length };
  }
  function changed(path) {
    const fire = (fns, arg) => fns && fns.forEach(fn => setTimeout(() => fn(arg()), 0));
    fire(docListeners.get(path), () => docSnap(path));
    fire(colListeners.get(path.split("/")[0]), () => colSnap(path.split("/")[0]));
  }
  function listen(map, key, fn, snap) {
    if (!map.has(key)) map.set(key, new Set());
    map.get(key).add(fn);
    setTimeout(() => fn(snap()), 0);
    return () => map.get(key).delete(fn);
  }
  function doc(path) {
    return {
      id: path.split("/").pop(), path,
      onSnapshot: fn => listen(docListeners, path, fn, () => docSnap(path)),
      get: async () => docSnap(path),
      set: async data => { docs.set(path, JSON.parse(JSON.stringify(data))); changed(path); },
      update: async data => { docs.set(path, Object.assign({}, docs.get(path) || {}, data)); changed(path); },
      delete: async () => { docs.delete(path); changed(path); },
    };
  }
  const db = {
    doc,
    collection: name => ({
      onSnapshot: fn => listen(colListeners, name, fn, () => colSnap(name)),
      doc: id => doc(name + "/" + id),
    }),
  };
  return { mcp, db };
}
if (typeof module !== "undefined") module.exports = { makeDemoAdapters };
