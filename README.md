# Project Feed

One feed of everything that's waiting on you, with a first step on every card.

Project Feed is a single-page [Claude artifact](https://claude.ai) that sits on top of a Notion task database. Overnight agents (Claude Code, run on a schedule) read your email, money and deadlines, and file what they find as Triage cards. In the morning you scroll one feed instead of five apps: Keep or Drop each card, see what's due, answer the agents' questions, and hit ▶ Claude to open a Claude Code session on any task.

It started as a replacement for Reddit: something worth looking at while Claude is thinking.

> **Status:** early. This repo has the feed page (the artifact) and its demo. The overnight agents, `/setup` and the Notion template are still being pulled out of a personal setup. See [docs/idea.md](docs/idea.md) for the plan.

## The page

`web/inbox.html` is one file that runs in two modes today, with a third planned:

| Mode | What it shows | Needs |
|---|---|---|
| **Demo** | A made-up week for Maya, who runs a two-person design studio and is applying for an arts grant. Every tab is filled, and dates follow today so it never goes stale. | Nothing. Open the file. |
| **Live** | Your own Notion Tasks and Projects, plus questions and notes the agents leave in the page's database. | Published as a Claude artifact with the `mcp` (Notion), `db` and `user` capabilities |
| **Setup** *(planned)* | The same feed, filled with setup cards: each step is a card with a first step and a ▶ button. | |

Tabs: **Feed** (everything, ranked), **Triage** (what the agents found overnight), **Due**, **Open**, **Notes**, **Questions** and **Agents**. Project chips under the tabs narrow the whole feed to one project.

### Try the demo

```sh
python3 web/build.py          # writes dist/inbox.html (live) and dist/inbox-demo.html (demo)
open dist/inbox-demo.html
```

Sample data only goes into the demo build. The live build never contains it.

### Run it live

1. Build, then publish `dist/inbox.html` as an artifact from Claude Code with the `mcp`, `db` and `user` capabilities.
2. Write a `config/workspace` doc into the page's database. The page reads everything about your workspace from there, so nothing personal lives in the HTML:

```js
{
  name: "Maya's HQ", ownerName: "Maya", ownerAssignee: "Maya", delegateName: "Sam", home: "/Users/maya",
  tasksDs: "collection://<your Tasks data source id>",
  views: { triage: "<db id>?v=<view id>", open: "<db id>?v=<view id>", projects: "<db id>?v=<view id>" },
  footer: { triage: "<link to the Triage view>", all: "<link to all tasks>" },
  folderFallback: {}, projectThemes: {}, setupUrl: ""
}
```

Your Tasks database needs `Task`, `Status` (including `Triage`), `Priority`, `Assignee`, `Due Date`, `First step`, `Notes` and a `Project` relation. Projects need `Name`, `Category` and, optionally, `Claude folder`.

The ▶ Claude buttons go through a small localhost launcher that opens Claude Code on the task. It isn't in this repo yet. Without it, ▶ shows a prompt to paste into Claude Code instead.

## The method: a first step on everything

Every task carries its first step, the smallest physical action (2–10 minutes, like "open the quote and change the date"). Momentum starts the moment you look at the card. The page shows the first step on every card, and the agents are told never to file a task without one.

## Tests

```sh
python3 -m unittest discover -s tests
```

They check the build, the demo adapters and data, the project filters, and that no Notion IDs or tokens are hardcoded in the template. To guard against your own names leaking into the template, list them one per line in `tests/personal.txt`. That file is gitignored.

Node is needed for some of the tests.

## License

MIT
