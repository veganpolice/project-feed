// Sample data for the Inbox demo: a made-up week for Maya, who runs a two-person design studio and is applying
// for a city arts grant. Every date is relative to the viewer's today, so the demo never goes stale.
// Rows mirror what the Notion saved views return; the page reads them through web/demo-adapters.js.
(function (root) {
  function buildDemo(now) {
    const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const pad = n => String(n).padStart(2, "0");
    const day = n => { const d = new Date(base); d.setDate(d.getDate() + n); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); };
    const run = n => day(n).replace(/-/g, "") + "-040000";
    let seq = 0;
    const hex = prefix => (prefix + (++seq).toString(16)).padEnd(32, "0").slice(0, 32);
    const url = prefix => "https://www.notion.so/demo-" + hex(prefix);

    const P = {
      clients: { Name: "Studio clients", Category: "Clients", theme: "clients" },
      grant: { Name: "Mural grant application", Category: "Creative", theme: "grant" },
      type: { Name: "Typeface side project", Category: "Creative", theme: "type" },
      ops: { Name: "Studio ops", Category: "Business", theme: "studio" },
      home: { Name: "Home", Category: "Home", theme: "home" },
      money: { Name: "Money & taxes", Category: "Finance", theme: "finance" },
      health: { Name: "Health", Category: "Health", theme: "health" },
    };
    Object.values(P).forEach(p => { p.url = url("a0"); });
    const projects = Object.values(P).map(p => ({ url: p.url, Name: p.Name, Category: p.Category, "Claude folder": "" }));
    const proj = (...keys) => JSON.stringify(keys.map(k => P[k].url));

    const T = (o) => Object.assign({ Status: "To Do", Priority: "Medium", Assignee: "Maya", Notes: "", Source: "", Draft: "", "date:Due Date:start": null }, o, { url: url("b0") });
    const tasks = [
      // Triage: what the agents found overnight
      T({ Task: "Reply to Priya about the bakery menu redesign quote", Status: "Triage", Priority: "High", Project: proj("clients"),
        Source: "Gmail · Priya, Cedar Lane Bakery · " + day(-1), "First step": "Open the drafted reply and check the price line (2 min)",
        Notes: "[comms nightly " + run(0) + "] Unanswered 2 days; she asked for a quote by Friday. Draft staged.",
        Draft: "https://mail.google.com/mail/u/0/#drafts" }),
      T({ Task: "Confirm the print proof for the gallery poster", Status: "Triage", Project: proj("clients"),
        Source: "WhatsApp · Jonah (printer) · " + day(-1), "First step": "Reply 'approved' or send the two fixes you circled (3 min)",
        Notes: "[sweeper nightly " + run(0) + "] From a WhatsApp message: proof ready, press slot held until Thursday." }),
      T({ Task: "Book the site visit at the community centre wall", Status: "Triage", Project: proj("grant"),
        Source: "Meeting · Grant info session · " + day(-2), "First step": "Email the centre coordinator two times next week (5 min)",
        Notes: "[sweeper nightly " + run(-1) + "] Said in the info session recording: applicants who visit the site score higher on feasibility." }),
      T({ Task: "Renew the font licence for the studio's brand typeface", Status: "Triage", Priority: "Low", Project: proj("ops"),
        Source: "Gmail · Type foundry receipts · " + day(-3), "First step": "Open the renewal email and check whether 2 seats is still enough (2 min)",
        Notes: "[finance nightly " + run(0) + "] Renews in 12 days at $96/yr. You have 2 seats; Sam is the only other user." }),
      T({ Task: "Ask Sam which weekend works for the cabin trip", Status: "Triage", Priority: "Low", Assignee: "Both", Project: proj("home"),
        Source: "iMessage · Sam · " + day(-1), "First step": "Send Sam the two free weekends from your calendar (2 min)",
        Notes: "[sweeper nightly " + run(0) + "] Sam asked twice this week." }),

      // Overdue
      T({ Task: "Send the invoice for the Riverside Books logo", Priority: "High", Project: proj("clients", "money"), "date:Due Date:start": day(-3),
        "First step": "Duplicate last month's invoice and change the line items (5 min)",
        Notes: "[finance nightly " + run(-1) + "] Delivered 9 days ago; no invoice in Sent. Net 30 starts when you send it." }),
      T({ Task: "File the quarterly sales tax return", Priority: "Urgent", Project: proj("money"), "date:Due Date:start": day(-1),
        "First step": "Open the books summary and copy the quarter's tax collected (5 min)",
        Notes: "[bookkeeper nightly " + run(0) + "] All 61 transactions this quarter are classified; tax collected is ready in the summary.\n[clocks nightly " + run(-6) + "] Due date added from the tax agency's reminder email." }),
      T({ Task: "Write the 'about the artist' paragraph", Project: proj("grant"), "date:Due Date:start": day(-2),
        "First step": "Paste your studio bio into the form and cut it to 150 words (10 min)" }),

      // Due this week
      T({ Task: "Submit the mural grant application", Priority: "Urgent", Status: "In Progress", Project: proj("grant"), "date:Due Date:start": day(4),
        "First step": "Open the form and finish section 3, the budget table (10 min)",
        Notes: "[clocks nightly " + run(0) + "] Deadline confirmed on the city's call page: 5 pm.\n[opportunities nightly " + run(-7) + "] Found this call; you said yes." }),
      T({ Task: "Get two quotes for wall primer and anti-graffiti coat", Project: proj("grant"), "date:Due Date:start": day(2),
        "First step": "Call the paint shop on 4th and ask for the mural rate (5 min)" }),
      T({ Task: "Present round 2 logo concepts to Riverside Books", Priority: "High", Project: proj("clients"), "date:Due Date:start": day(1),
        "First step": "Export the three concepts to one PDF (5 min)",
        Notes: "[clients nightly " + run(0) + "] Call booked tomorrow 10:00. Last email from them asked to see the green option bigger." }),
      T({ Task: "Physio appointment for the shoulder", Project: proj("health"), "date:Due Date:start": day(0),
        "First step": "Put the exercise sheet in your bag (1 min)" }),
      T({ Task: "Pay the studio rent", Project: proj("money", "ops"), "date:Due Date:start": day(3), Assignee: "Both",
        "First step": "Log in to the bank and schedule the transfer (3 min)",
        Notes: "[finance nightly " + run(0) + "] Same amount as last month; account balance covers it." }),

      // Open, no near date
      T({ Task: "Draw the lowercase 'g' for the typeface", Priority: "Low", Project: proj("type"),
        "First step": "Trace the 'o' as the bowl and sketch three tail shapes (10 min)" }),
      T({ Task: "Set up a shared folder for client assets", Project: proj("ops"),
        "First step": "Create the folder and move the Riverside files into it (5 min)" }),
      T({ Task: "Update the website portfolio with the bakery project", Priority: "Low", Project: proj("ops", "clients"),
        "First step": "Pick the three best photos from the shoot (5 min)" }),
      T({ Task: "Fix the dripping kitchen tap", Priority: "Low", Project: proj("home"), Assignee: "Both",
        "First step": "Look up the tap model under the sink (2 min)" }),
      T({ Task: "Ask the accountant whether the new laptop is a full write-off", Project: proj("money"), Status: "Blocked",
        "First step": "Forward the receipt with the one-line question (2 min)",
        Notes: "[bookkeeper nightly " + run(-2) + "] Marked unknown: used for client work and personal email. Waiting on the accountant." }),
      T({ Task: "Write up a scope template for small logo jobs", Priority: "High", Project: proj("clients", "ops"),
        "First step": "Copy the Riverside scope and delete everything client-specific (10 min)",
        Notes: "[scout nightly " + run(-1) + "] Idea: three of the last four jobs started with a two-week email back-and-forth about scope." }),
      T({ Task: "Book the annual check-up", Priority: "Low", Project: proj("health"),
        "First step": "Call the clinic when it opens at 8 (3 min)" }),
      T({ Task: "Back up the studio drive", Project: proj("ops"),
        "First step": "Plug in the backup drive and start the backup app (2 min)",
        Notes: "[ops nightly " + run(0) + "] Last backup was 23 days ago." }),
    ];

    const notes = {
      synced: base.toISOString(),
      items: [
        { id: "n1", p: "type", t: "Try a monospaced cut of the typeface for code", d: day(-4), note: "Ideas", q: "what if the typeface had a mono version for code editors?", step: "Sketch 'm' and 'i' at the same width (10 min)" },
        { id: "n2", p: "clients", t: "Offer a small 'menu refresh' package for cafes", d: day(-2), note: "Business ideas", q: "cafes keep asking for just the menu. package it?", step: "Write the three things the package includes (5 min)" },
        { id: "n3", p: "home", t: "Plant garlic before the first frost", d: day(-6), note: "Garden", q: "garlic in by end of month", step: "Check the frost date for this week (1 min)", check: true },
        { id: "n4", p: "grant", t: "Invite neighbours to help paint one section of the mural", d: day(-1), note: "Mural", q: "community paint day? grant likes community involvement", step: "Add one line about a paint day to the grant's community section (5 min)" },
      ],
    };
    const questions = {
      run: run(0),
      items: [
        { n: 1, key: "comms.priya-quote", agent: "comms", kind: "clarify", doer: "maya", text: "Priya asked for the menu redesign quote by Friday. Is $1,800 still your rate for a two-page menu, or should the draft say something else?" },
        { n: 2, key: "finance.font-licence", agent: "finance", kind: "offer", doer: "agent", text: "The font licence renews in 12 days for 2 seats. Want me to stage a reply asking to drop to 1 seat, or leave it as is?" },
        { n: 3, key: "clients.riverside-call", agent: "clients", kind: "offer", doer: "session", text: "Riverside Books' call is tomorrow at 10. Want a desk session to put the green concept on a larger artboard before the call?" },
        { n: 4, key: "bookkeeper.laptop", agent: "bookkeeper", kind: "clarify", doer: "maya", text: "The new laptop: roughly what share is studio work? One percentage covers it." },
        { n: 5, key: "opportunities.zine-fair", agent: "opportunities", kind: "offer", doer: "agent", text: "The downtown zine fair has open table applications until the 30th ($40 table). Want me to add it to Clocks and make a task?" },
        { n: 6, key: "clocks.grant-report", agent: "clocks", kind: "clarify", doer: "maya", text: "If the mural grant comes through, the final report is due 60 days after the wall is finished. What finish date should I track?" },
      ],
    };

    const themes = {};
    Object.values(P).forEach(p => { themes[p.Name] = p.theme; });
    return {
      blurb: "Maya runs a two-person design studio and is applying for a city arts grant.",
      workspace: {
        name: "Maya's HQ", ownerName: "Maya", ownerAssignee: "Maya", delegateName: "Sam", home: "/Users/maya",
        tasksDs: "collection://" + hex("c0"),
        views: { triage: hex("d1") + "?v=" + hex("e1"), open: hex("d1") + "?v=" + hex("e2"), projects: hex("d2") + "?v=" + hex("e3") },
        footer: { triage: "https://www.notion.so/", all: "https://www.notion.so/" },
        folderFallback: {}, projectThemes: themes, setupUrl: "",
      },
      projects, tasks,
      db: { "notes/ideas": notes, "brief/questions": questions },
    };
  }
  if (typeof module !== "undefined") module.exports = { buildDemo };
  if (typeof window !== "undefined") window.DEMO = buildDemo(new Date());
})(typeof globalThis !== "undefined" ? globalThis : this);
