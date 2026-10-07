"""The Inbox page template (web/): no personal identifiers, a working build, and demo adapters and data that
answer the calls the page makes."""
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WEB = os.path.join(ROOT, "web")
NODE = shutil.which("node")
# Names and values from your own workspace that must never reach the template or the demo. Put one per line in
# tests/personal.txt (gitignored), so the list itself is never published.
_PERSONAL_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "personal.txt")
PERSONAL = tuple(l.strip() for l in open(_PERSONAL_FILE, encoding="utf-8") if l.strip() and not l.startswith("#")) \
    if os.path.exists(_PERSONAL_FILE) else ()


def read(name):
    return open(os.path.join(WEB, name), encoding="utf-8").read()


def node(script):
    r = subprocess.run([NODE, "-e", script], capture_output=True, text=True, cwd=WEB, timeout=30)
    if r.returncode != 0:
        raise AssertionError(r.stderr)
    return json.loads(r.stdout)


class TemplateTests(unittest.TestCase):
    def test_no_personal_identifiers_in_web(self):
        for name in ("inbox.html", "demo-data.js", "demo-adapters.js"):
            text = read(name)
            for word in PERSONAL:
                self.assertNotIn(word, text, "%s mentions %s" % (name, word))
            self.assertNotRegex(text, r"/Users/(?!maya)", name)
        tpl = read("inbox.html")
        self.assertNotIn("LAUNCH_TOKEN", tpl)
        self.assertIsNone(re.search(r"[0-9a-f]{32}", tpl), "a Notion id or token is hardcoded in the template")

    def test_every_workspace_key_the_page_reads_is_normalized(self):
        tpl = read("inbox.html")
        used = set(re.findall(r"WORKSPACE\.(\w+)", tpl))
        norm = re.search(r"function normalizeWorkspace\(w\)\{(.*?)\n\}", tpl, re.S).group(1)
        given = set(re.findall(r"(\w+):w\.", norm))
        self.assertEqual(used - given, set())

    def test_every_tab_has_its_section(self):
        tpl = read("inbox.html")
        for tab in ("feed", "triage", "due", "open", "notes", "questions", "agents"):
            self.assertIn('data-tab="%s"' % tab, tpl)
            self.assertIn('data-sec="%s"' % tab, tpl)

    def test_project_bar_sits_in_the_sticky_tabs_and_storage_is_guarded(self):
        tpl = read("inbox.html")
        nav = re.search(r'<nav class="tabs".*?</nav>', tpl, re.S).group(0)
        self.assertIn('id="projBar"', nav)
        for line in tpl.splitlines():
            if "inbox-proj" in line:
                self.assertIn("try", line, line)


@unittest.skipUnless(NODE, "node not installed")
class ProjectFilterTests(unittest.TestCase):
    """The filter helpers, lifted out of the template and run against stub themes and rows."""

    def run_helpers(self, body):
        tpl = read("inbox.html")
        helpers = re.search(r"(const PROJ_TABS.*?)\nfunction renderProjBar", tpl, re.S).group(1)
        stubs = ("const THEMES={general:{label:'General'},art:{label:'Art'},home:{label:'Home'}};"
                 "const state={hidden:new Set(['h1']),proj:null,triage:[],open:[]};"
                 "const pageId=u=>u; let rendered=0; const render=()=>rendered++;"
                 "const localStorage={setItem(){},removeItem(){}};"
                 "const themeOfTask=r=>r.th; let NOTES=[]; const openNotes=()=>NOTES;")
        return node(stubs + helpers + body)

    def test_groups_count_tasks_and_notes_by_rail_label_busiest_first(self):
        d = self.run_helpers("""
          state.triage=[{url:'a',th:{key:'art'}},{url:'h1',th:{key:'art'}}];
          state.open=[{url:'b',th:{key:'art'}},{url:'c',th:{key:'home',label:'Kitchen'}},{url:'d',th:{key:'nope'}}];
          NOTES=[{p:'home'},{p:'missing'}];
          console.log(JSON.stringify(projGroups().map(g=>[g.label,g.key,g.n])));""")
        # The hidden row (h1) is not counted; an unknown theme key falls back to General; a project label beats the theme's.
        self.assertEqual(d, [["Art", "art", 2], ["General", "general", 2], ["Home", "home", 1], ["Kitchen", "home", 1]])

    def test_picking_a_project_narrows_and_all_clears(self):
        d = self.run_helpers("""
          const out={}; out.before=inProj('Art');
          setProj('Art'); out.art=[inProj('Art'),inProj('Home'),state.proj,state.feedShown];
          setProj(null); out.cleared=[inProj('Home'),state.proj]; out.renders=rendered;
          console.log(JSON.stringify(out));""")
        self.assertTrue(d["before"])
        self.assertEqual(d["art"], [True, False, "Art", 12])
        self.assertEqual(d["cleared"], [True, None])
        self.assertEqual(d["renders"], 2)


class BuildTests(unittest.TestCase):
    def setUp(self):
        self.out = tempfile.mkdtemp(prefix="la-inbox-")

    def tearDown(self):
        shutil.rmtree(self.out, ignore_errors=True)

    def run_build(self, web=None):
        script = os.path.join(web or WEB, "build.py")
        return subprocess.run([sys.executable, script, "--out", self.out], capture_output=True, text=True)

    def test_live_build_has_no_demo_data_and_demo_build_has_it(self):
        r = self.run_build()
        self.assertEqual(r.returncode, 0, r.stderr)
        live = open(os.path.join(self.out, "inbox.html")).read()
        demo = open(os.path.join(self.out, "inbox-demo.html")).read()
        self.assertIn('INBOX_MODE = "live"', live)
        self.assertNotIn("function buildDemo", live)
        self.assertNotIn("function makeDemoAdapters", live)
        self.assertIn('INBOX_MODE = "demo"', demo)
        self.assertIn("function buildDemo", demo)
        self.assertIn("function makeDemoAdapters", demo)
        self.assertIn("<title>Life Agents Inbox</title>", demo)
        self.assertNotIn("<!-- INBOX_BUILD -->", live + demo)

    def test_template_without_the_marker_fails(self):
        tmp = tempfile.mkdtemp(prefix="la-web-")
        try:
            for f in os.listdir(WEB):
                if not f.startswith("."):
                    shutil.copy(os.path.join(WEB, f), tmp)
            p = os.path.join(tmp, "inbox.html")
            open(p, "w").write(open(p).read().replace("<!-- INBOX_BUILD -->", ""))
            r = self.run_build(tmp)
            self.assertNotEqual(r.returncode, 0)
            self.assertIn("INBOX_BUILD", r.stderr)
        finally:
            shutil.rmtree(tmp, ignore_errors=True)

    @unittest.skipUnless(NODE, "node not installed")
    def test_built_scripts_parse(self):
        self.assertEqual(self.run_build().returncode, 0)
        for name in ("inbox.html", "inbox-demo.html"):
            for i, js in enumerate(re.findall(r"<script[^>]*>(.*?)</script>", open(os.path.join(self.out, name)).read(), re.S)):
                f = os.path.join(self.out, "%s-%d.js" % (name, i))
                open(f, "w").write(js)
                r = subprocess.run([NODE, "--check", f], capture_output=True, text=True)
                self.assertEqual(r.returncode, 0, "%s script %d: %s" % (name, i, r.stderr))


@unittest.skipUnless(NODE, "node not installed")
class DemoTests(unittest.TestCase):
    PRELUDE = ("const {buildDemo}=require('./demo-data.js'); const {makeDemoAdapters}=require('./demo-adapters.js');"
               "const D=buildDemo(new Date(2026,9,3)); const {mcp,db}=makeDemoAdapters(D);"
               "const V=v=>({data:{mode:'view',view_url:'https://app.notion.com/p/'+D.workspace.views[v],page_size:100}});"
               "const tick=()=>new Promise(r=>setTimeout(r,5));")

    def test_sample_data_fills_every_tab(self):
        d = node(self.PRELUDE + """
          const day=s=>new Date(s+'T00:00:00'), today=new Date(2026,9,3);
          const due=D.tasks.map(t=>t['date:Due Date:start']).filter(Boolean).map(s=>Math.round((day(s)-today)/864e5));
          const projUrls=new Set(D.projects.map(p=>p.url));
          console.log(JSON.stringify({
            triage:D.tasks.filter(t=>t.Status==='Triage').length, overdue:due.filter(n=>n<0).length, week:due.filter(n=>n>=0&&n<=7).length,
            noStep:D.tasks.filter(t=>!t['First step']).length, badUrl:D.tasks.filter(t=>!/[0-9a-f]{32}$/.test(t.url)).length,
            badProj:D.tasks.filter(t=>JSON.parse(t.Project).some(u=>!projUrls.has(u))).length,
            notes:D.db['notes/ideas'].items.length, questions:D.db['brief/questions'].items.length,
            agents:[...new Set(D.tasks.map(t=>(t.Notes.match(/\\[(\\w+) nightly/)||[])[1]).filter(Boolean))].length}));""")
        self.assertGreaterEqual(d["triage"], 4)
        self.assertGreaterEqual(d["overdue"], 1)
        self.assertGreaterEqual(d["week"], 1)
        self.assertEqual((d["noStep"], d["badUrl"], d["badProj"]), (0, 0, 0))
        self.assertGreaterEqual(d["notes"], 3)
        self.assertGreaterEqual(d["questions"], 4)
        self.assertGreaterEqual(d["agents"], 6)

    def test_dates_follow_today(self):
        d = node("const {buildDemo}=require('./demo-data.js');"
                 "const a=buildDemo(new Date(2026,9,3)), b=buildDemo(new Date(2027,0,10));"
                 "console.log(JSON.stringify([a.tasks[5]['date:Due Date:start'], b.tasks[5]['date:Due Date:start']]))")
        self.assertEqual(d, ["2026-09-30", "2027-01-07"])

    def test_keep_moves_a_card_from_triage_to_open(self):
        d = node(self.PRELUDE + """
          (async()=>{ const seen={};
            mcp.watchTool('Notion','notion-query-data-sources',V('triage'),e=>{seen.triage=e.result.payload.results.length;});
            mcp.watchTool('Notion','notion-query-data-sources',V('open'),e=>{seen.open=e.result.payload.results.length;});
            await tick(); const before={...seen};
            const t=D.tasks.find(r=>r.Status==='Triage'); const id=t.url.match(/([0-9a-f]{32})$/)[1];
            await mcp.callTool('Notion','notion-update-page',{page_id:id,command:'update_properties',properties:{Status:'To Do'}});
            await tick(); console.log(JSON.stringify({before, after:seen, original:t.Status}));})();""")
        self.assertEqual(d["after"]["triage"], d["before"]["triage"] - 1)
        self.assertEqual(d["after"]["open"], d["before"]["open"] + 1)
        self.assertEqual(d["original"], "Triage")  # the adapter copies rows; DEMO itself is never mutated

    def test_add_to_tasks_creates_an_open_row(self):
        d = node(self.PRELUDE + """
          (async()=>{ let open=0; mcp.watchTool('Notion','notion-query-data-sources',V('open'),e=>{open=e.result.payload.results.length;});
            await tick(); const before=open;
            await mcp.callTool('Notion','notion-create-pages',{parent:{type:'data_source_id',data_source_id:'x'},pages:[{properties:{Task:'New idea',Status:'To Do','First step':'Do it'}}]});
            await tick(); console.log(JSON.stringify({before,after:open}));})();""")
        self.assertEqual(d["after"], d["before"] + 1)

    def test_unknown_page_and_tool_are_refused(self):
        d = node(self.PRELUDE + """
          (async()=>{ const out=[];
            for(const [tool,args] of [['notion-update-page',{page_id:'f'.repeat(32),properties:{}}],['notion-delete-everything',{}]]){
              try{ await mcp.callTool('Notion',tool,args); out.push('ok'); }catch(e){ out.push(e.code); } }
            console.log(JSON.stringify(out));})();""")
        self.assertEqual(d, ["tool_error", "tool_error"])

    def test_db_set_and_delete_reach_listeners(self):
        d = node(self.PRELUDE + """
          (async()=>{ const doc=[], col=[];
            db.doc('answered/q1').onSnapshot(s=>doc.push(s.exists));
            db.collection('answered').onSnapshot(s=>col.push(s.docs.length));
            await tick(); await db.collection('answered').doc('q1').set({at:'2026-10-03'}); await tick();
            await db.doc('answered/q1').delete(); await tick();
            const q=await db.doc('brief/questions').get();
            console.log(JSON.stringify({doc, col, seeded:q.exists && q.data().items.length>0}));})();""")
        self.assertEqual(d["doc"], [False, True, False])
        self.assertEqual(d["col"], [0, 1, 0])
        self.assertTrue(d["seeded"])


if __name__ == "__main__":
    unittest.main()
