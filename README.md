# IT PMO Kanban Training

A single-file Kanban board demo for training IT PMO analysts (fictitious bank, internal training tool).

- **Learn** tab with a four-step guide, priority legend and an animated task-flow demo
- **Board** view plus one tab per status (Backlog, In Progress, Blocked, Done) with live counts
- Drag cards between columns or onto a status tab, or use **Move ▸**
- Animated progress ring, status bar and counters; respects `prefers-reduced-motion`
- Vanilla HTML/CSS/JS, no build, no dependencies, works from `file://`
- Demo data lives in memory only; refreshing resets the board

Open `index.html` in a browser to run it. The optional new-task email notification uses FormSubmit; set `FORMSUBMIT_ENDPOINT` at the top of the script.
