# The idea

Overnight agents that read your email, money and deadlines, and leave you one feed of what needs you, each item with its first step.

This started as a personal setup: a team of Claude Code agents that run at 4 am on a Mac, plus a Claude artifact that shows what they found. This doc is the plan for turning it into something a friend could install in an afternoon.

## The feed is the front door

The agents and their briefs explain *how* it works. The feed page is *what it feels like*. So the page leads everywhere: the README, the demo, setup, and the daily view after setup.

### One page, three modes

`web/inbox.html` is rendered in three ways:

1. **Demo** (a public link, no capabilities). Built-in sample data for a made-up founder, with every tab filled and the agents' notes on the cards. Buttons say what they would do instead of doing it. Anyone can click through without an account. ✅ Built.
2. **Setup** (your own copy, before the first run). The same feed, filled with **setup cards** instead of tasks. Each step is a card with a first step and a ▶ button, so setup uses the same first-step-on-everything method as the rest of the system.
3. **Live** (after the first run). Your own tasks, the agents' Triage cards, their questions, and notes pulled from your note app. ✅ Built.

The mode comes from what the page has: no capabilities means demo; capabilities but no workspace config (or unfinished setup) means setup; otherwise live.

### Setup as feed cards

```
 ┌──────────────────────────────────────────────────────────────┐
 │ INBOX · setting up                          ● 3 of 7 done    │
 │ Your agents start working tonight once 4 more steps are done.│
 ├──────────────────────────────────────────────────────────────┤
 │ ✓ Connect Notion                              done 10:02     │
 │ ✓ Create your workspace (Tasks, Projects…)    done 10:05     │
 │ ✓ Tell it about you                           done 10:20     │
 │ ┃ SETUP · 4 of 7                                             │
 │ ┃ Pick your packs                                            │
 │ ┃ Freelance studio · Founder grants · Sole-prop books        │
 │ ┃ FIRST STEP  Tick the packs that sound like you (2 min)     │
 │ ┃ [Choose]                                    [▶ Claude]     │
 │   Connect Gmail · Turn on the overnight run · First run      │
 └──────────────────────────────────────────────────────────────┘
```

| Step | Done where | How the page knows |
|---|---|---|
| 1. Connect Notion | in the page (the Notion consent prompt) | a test query succeeds |
| 2. Create your workspace | in the page: it duplicates a published Notion template with your own connector and saves the new IDs | `config/workspace` doc in the page's db |
| 3. Tell it about you | ▶ Claude: `/setup profile` interview | `/setup` writes `setup/status` |
| 4. Pick your packs | in the page (pack cards with a one-line "for people who…") | `setup/choices`, which `/setup` reads |
| 5. Connect Gmail | ▶ Claude: `/setup gmail` (OAuth runs on your Mac) | `setup/status` |
| 6. Turn on the overnight run | ▶ Claude: `/setup schedule` (launchd, wake time, the local launcher for ▶ buttons) | `setup/status` |
| 7. First run | ▶ Claude: a dry `/nightly`, then `/team` | Questions and Agents tabs fill and the page switches to live |

**The bootstrap gap:** ▶ buttons need the local launcher, which is installed in step 6. Until then, ▶ falls back to a "copy this into Claude Code" sheet.

**The way in:** install the plugin and run `/setup`. Its first job is to publish your own copy of the page and open it. From there the page leads.

**Sharing is by copy, not by link.** Pages that read Notion can't be shared publicly, and each person's questions and notes have to sit in a database their own Claude can write to. So everyone publishes their own copy. Only the demo is a public link.

### Already done in the page

- **No hardcoded workspace.** Data source IDs, view URLs, home folder, the delegate's name and project themes all come from a `config/workspace` doc in the page's db.
- **No token in the HTML.** The launcher token lives in the viewer's private db path (`data/users/<id>/launcher`).
- **Demo data never reaches a live page.** `web/build.py` inlines it into the demo build only, and the tests check that.

## The rest of the system

**The agents** (Claude Code prompts, run nightly with `claude -p`):

- **Finance**: subscriptions, bills, tax deadlines, the bank ledger
- **Comms**: unanswered email, drafts replies (never sends)
- **Clocks**: deadlines, renewals, event checklists
- **Sweeper**: runs last and files everything as Triage cards, each with a `Kind`: Task, Note, Change, Email or Idea
- **Scout / Opportunities**: open grants and calls that fit your active projects, with the deadline checked on the official page
- **Ops**: the system checking itself
- Domain agents (**Books**, **Clients**) ship as a generic core plus **packs**: starter kits for a kind of business, each with an example config, seed rules and a Notion template.

**Your answers become rules.** Every Keep or Drop, and every answer to an agent's question, is saved as a dated rule the agents read the next night. The system learns what you care about without you editing config.

**Delegates.** Agents can work for a household or a two-person business, not just you. A delegate is someone the agents can ask but never act as: their own inbox, their own questions, and never sending as them.

**Safety model.** Agents never send email, never pay anything and never act as a delegate. They draft and propose, and you approve from the feed.

**Requirements.** A Mac, a Claude subscription that covers nightly `claude -p` runs, Notion and Gmail.

## Order of work

1. ✅ Delegates generalised behind config.
2. ✅ The feed page: workspace-neutral template, demo mode, sample data, build script. *(this repo)*
3. Move the remaining hardcoded values in the agent runner into config.
4. Split the domain agents into core + profile + pack.
5. The page's setup mode, `/setup`, a bank-CSV importer, launchd templates, and the localhost launcher.
6. Copy the engine, templates and packs into this repo, with skeleton rules and demo fixtures so the tests and a dry run work without any accounts. Scan for secrets and personal data before every push.
7. Notion template, a README GIF of the demo, and the plugin manifest. Set it up with one friend before announcing anything.
