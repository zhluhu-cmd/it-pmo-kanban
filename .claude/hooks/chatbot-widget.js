/* Cyberpunk IT-assistant chatbot widget (v2 site).
   Source of truth for the widget. A copy is inlined at the bottom of
   index.html (between the CHATBOT-WIDGET markers) because the page must work
   from file:// as a single file. If you edit this file, update that copy too.

   - Text chat, RAG-style: retrieve the best-matching knowledge chunks
     (static help articles + live chunks built from the board's tasks), then
     compose the answer from them and cite the sources. All local, no network.
   - Click hook: opening the widget (a user click) speaks
     "I am your IT assistant, how can I help you" via the browser's built-in
     speechSynthesis. No audio files, nothing is stored. */
(function () {
  "use strict";

  var GREETING = "I am your IT assistant, how can I help you";

  /* ---------- styles (appended after the page CSS, so these win ties) ---------- */
  var css = [
    ".toast-region { bottom: 6.5rem; }",
    ".cb-root { --cb-cyan: #22d3ee; --cb-pink: #ec4899; --cb-violet: #a855f7; --cb-bg: #0b0620; --cb-bg2: #170a3a; position: fixed; right: 1rem; bottom: 1rem; z-index: 90; font-family: var(--font); }",
    ".cb-launch { display: grid; place-items: center; width: 4.5rem; height: 4.5rem; padding: 0; border-radius: 50%; border: 2px solid var(--cb-cyan); background: var(--cb-bg); cursor: pointer; box-shadow: 0 0 0 3px rgba(34,211,238,.18), 0 0 22px rgba(236,72,153,.55); transition: transform calc(160ms * var(--motion)) var(--ease-out), box-shadow calc(160ms * var(--motion)) ease; }",
    ".cb-launch:hover { transform: scale(1.06); box-shadow: 0 0 0 3px rgba(34,211,238,.35), 0 0 30px rgba(236,72,153,.8); }",
    ".cb-launch:active { transform: scale(0.96); }",
    ".cb-launch svg { width: 3.5rem; height: 3.5rem; }",
    ".cb-badge { position: absolute; top: -0.3rem; right: -0.2rem; padding: 1px 7px; border-radius: 999px; background: var(--cb-pink); color: #fff; font-size: 0.625rem; font-weight: 800; letter-spacing: .08em; box-shadow: 0 0 10px var(--cb-pink); pointer-events: none; }",
    ".cb-root.cb-open .cb-badge { display: none; }",
    ".cb-panel { position: absolute; right: 0; bottom: 5.5rem; width: min(23rem, calc(100vw - 2rem)); height: min(32rem, calc(100vh - 8rem)); display: flex; flex-direction: column; overflow: hidden; border: 2px solid var(--cb-cyan); border-radius: 18px 18px 4px 18px; background: linear-gradient(180deg, var(--cb-bg2), var(--cb-bg)); color: #e6f9ff; box-shadow: 0 0 0 1px rgba(236,72,153,.5), 0 0 34px rgba(168,85,247,.55), 0 18px 40px rgba(0,0,0,.5); animation: cb-in calc(260ms * var(--motion)) var(--ease-out) both; }",
    ".cb-panel[hidden] { display: none; }",
    "@keyframes cb-in { from { opacity: 0; transform: translateY(14px) scale(.97); } to { opacity: 1; transform: none; } }",
    ".cb-head { display: flex; align-items: center; gap: .6rem; padding: .6rem .75rem; border-bottom: 1px solid rgba(34,211,238,.45); background: linear-gradient(90deg, rgba(34,211,238,.18), rgba(236,72,153,.18)); }",
    ".cb-head .cb-av { width: 2.75rem; height: 2.75rem; flex: none; border-radius: 50%; border: 1px solid var(--cb-cyan); background: var(--cb-bg); }",
    ".cb-title { flex: 1; min-width: 0; line-height: 1.2; }",
    ".cb-title b { display: block; font-size: .95rem; letter-spacing: .12em; text-transform: uppercase; color: var(--cb-cyan); text-shadow: 0 0 8px rgba(34,211,238,.8); }",
    ".cb-title span { font-size: .7rem; color: #f9a8d4; }",
    ".cb-icon-btn { width: 2rem; height: 2rem; padding: 0; border-radius: 6px; border: 1px solid rgba(34,211,238,.55); background: transparent; color: var(--cb-cyan); font-size: 1rem; cursor: pointer; }",
    ".cb-icon-btn:hover { background: rgba(34,211,238,.18); }",
    ".cb-icon-btn[aria-pressed=\"true\"] { color: #f9a8d4; border-color: #f9a8d4; }",
    ".cb-log { flex: 1; overflow-y: auto; padding: .75rem; display: flex; flex-direction: column; gap: .6rem; }",
    ".cb-msg { max-width: 88%; padding: .5rem .7rem; border-radius: 12px; font-size: .875rem; line-height: 1.4; white-space: pre-wrap; overflow-wrap: anywhere; }",
    ".cb-bot { align-self: flex-start; background: rgba(34,211,238,.12); border: 1px solid rgba(34,211,238,.5); border-bottom-left-radius: 2px; }",
    ".cb-user { align-self: flex-end; background: linear-gradient(135deg, #6366f1, #a855f7 55%, #ec4899); border-bottom-right-radius: 2px; color: #fff; }",
    ".cb-src { display: block; margin-top: .35rem; font-size: .68rem; letter-spacing: .04em; color: #f9a8d4; }",
    ".cb-chips { display: flex; flex-wrap: wrap; gap: .4rem; padding: 0 .75rem .5rem; }",
    ".cb-chip { padding: .25rem .65rem; border-radius: 999px; border: 1px solid var(--cb-pink); background: transparent; color: #fbcfe8; font-size: .75rem; cursor: pointer; }",
    ".cb-chip:hover { background: rgba(236,72,153,.22); }",
    ".cb-form { display: flex; gap: .5rem; padding: .6rem .75rem; border-top: 1px solid rgba(34,211,238,.45); background: rgba(0,0,0,.25); }",
    ".cb-input { flex: 1; min-width: 0; padding: .5rem .7rem; border-radius: 8px; border: 1px solid rgba(34,211,238,.6); background: var(--cb-bg); color: #e6f9ff; font: inherit; font-size: .875rem; }",
    ".cb-input::placeholder { color: #7dd3fc; opacity: .7; }",
    ".cb-send { padding: 0 .9rem; border: 0; border-radius: 8px; background: linear-gradient(135deg, #22d3ee, #a855f7 60%, #ec4899); color: #0b0620; font-weight: 800; letter-spacing: .06em; cursor: pointer; }",
    ".cb-send:hover { filter: brightness(1.15); }",
    ".cb-root :focus-visible { outline: 2px solid #fff; outline-offset: 2px; }",
    ".cb-scan { fill: none; stroke: var(--cb-cyan); stroke-width: .6; opacity: .35; }",
    ".cb-eye { fill: var(--cb-cyan); }",
    ".cb-mouth { fill: var(--cb-pink); transform-origin: 32px 46px; transform: scaleY(.25); }",
    ".cb-speaking .cb-mouth { animation: cb-talk calc(260ms * var(--motion)) ease-in-out infinite alternate; }",
    ".cb-speaking .cb-visor { animation: cb-glow calc(500ms * var(--motion)) ease-in-out infinite alternate; }",
    "@keyframes cb-talk { from { transform: scaleY(.25); } to { transform: scaleY(1.4); } }",
    "@keyframes cb-glow { from { opacity: .75; } to { opacity: 1; } }",
    "@media (prefers-reduced-motion: no-preference) { .cb-launch .cb-visor { animation: cb-glow 1.6s ease-in-out infinite alternate; } }"
  ].join("\n");
  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  /* ---------- avatar (inline SVG: neon visor, circuit lines) ---------- */
  var AVATAR =
    '<svg viewBox="0 0 64 64" aria-hidden="true" class="cb-avsvg">' +
    '<defs><linearGradient id="cbg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#22d3ee"/><stop offset="1" stop-color="#ec4899"/></linearGradient></defs>' +
    '<path d="M32 4 52 14v22c0 11-8 19-20 24C20 55 12 47 12 36V14z" fill="#12082e" stroke="url(#cbg)" stroke-width="2.2"/>' +
    '<path class="cb-scan" d="M18 20h6l3 4M46 20h-6l-3 4M18 42h5M46 42h-5M32 8v8"/>' +
    '<rect class="cb-visor" x="15" y="22" width="34" height="11" rx="5" fill="#0b0620" stroke="url(#cbg)" stroke-width="1.6"/>' +
    '<rect class="cb-eye" x="19" y="26" width="9" height="3" rx="1.5"/><rect class="cb-eye" x="36" y="26" width="9" height="3" rx="1.5"/>' +
    '<rect class="cb-mouth" x="25" y="44" width="14" height="4" rx="2"/>' +
    '<path d="M12 30h-4M52 30h4" stroke="#ec4899" stroke-width="2" stroke-linecap="round"/>' +
    '</svg>';

  /* ---------- knowledge base (the "documents" we retrieve from) ---------- */
  var KB = [
    { t: "Reading the board", k: "board column card read overview what is this", x: "The board has one column per status: Backlog, In Progress, Blocked and Done. Each card is one task showing its ID, priority, owner and due date. The bar at the top summarises the whole portfolio." },
    { t: "Moving a task", k: "move drag drop change status progress forward tab", x: "Drag a card to another column or onto a status tab, or press Move on the card and pick a status. Healthy work flows left to right: Backlog, In Progress, Done." },
    { t: "Adding a task", k: "add new create log task form submit email notification", x: "Choose + Add Task, fill in the form and submit. The card appears at once. The demo also tries to send an email notification in the background; if that fails you only see a warning, the board keeps working." },
    { t: "Overdue tasks", k: "overdue late past due date deadline missed", x: "A task is Overdue when its due date has passed and it is not Done. The badge is calculated automatically, it is never stored. Move the task to Done or review its plan." },
    { t: "Blocked tasks", k: "blocked stuck waiting dependency vendor approval unblock", x: "Blocked means the task is waiting on a dependency, vendor or approval. Someone needs to remove that dependency; raise it with the owner and escalate if it is Critical." },
    { t: "Priority guide", k: "priority critical high medium low urgent escalate colour", x: "Critical: service or security impact now, escalate today. High: important and time-bound, review daily. Medium: planned work at normal pace. Low: nice to have, schedule when capacity allows." },
    { t: "Statuses", k: "status backlog in progress done blocked meaning stages", x: "Backlog: logged, not yet scheduled. In Progress: actively being worked. Blocked: waiting on a dependency, vendor or approval. Done: completed or closed." },
    { t: "Projects and categories", k: "project category projects categories list portfolio", x: "Projects: Core Banking Upgrade, Digital Channels, Cybersecurity Uplift, Data & Analytics, Infrastructure & Cloud, Vendor Management. Categories: Application Development, Infrastructure, Cybersecurity, Data, Compliance, Vendor." },
    { t: "Task IDs", k: "id identifier number uob itpm format", x: "Every task gets an ID like UOB-ITPM-0001. New tasks continue the numbering automatically." },
    { t: "Deleting a task", k: "delete remove cancel confirm", x: "Use the delete control on a card. You are asked to confirm inline on the card before it is removed." },
    { t: "Saving and refresh", k: "save saved persist refresh reload reset data lost storage", x: "Nothing is saved. This is a training tool, so refreshing the page resets the board to the sample data. Experiment freely." },
    { t: "IT meeting notice", k: "meeting room 888 attendance mandatory it staff next week 10am", x: "There is an IT meeting next week at 10:00 AM in Room 888. Attendance is mandatory." },
    { t: "About the assistant", k: "who you help assistant bot hello hi hey what can do", x: "I am the IT assistant for this training board. Ask me how the board works, what priorities and statuses mean, or about the current tasks, for example overdue or blocked work." }
  ];

  /* live chunks: built from the board each time you ask, so answers reflect the current state */
  function liveChunks() {
    var out = [];
    if (typeof state === "undefined" || !state.tasks) return out;
    var tasks = state.tasks, i, counts = {}, lists = { overdue: [], blocked: [], critical: [], done: [] };
    for (i = 0; i < tasks.length; i++) {
      var t = tasks[i], line = t.id + " " + t.title + " (" + t.assignee + ", due " + t.dueDate + ")";
      counts[t.status] = (counts[t.status] || 0) + 1;
      if (typeof isOverdue === "function" && isOverdue(t)) lists.overdue.push(line);
      if (t.status === "Blocked") lists.blocked.push(line);
      if (t.priority === "Critical" && t.status !== "Done") lists.critical.push(line);
    }
    var parts = (typeof STATUSES !== "undefined" ? STATUSES : []).map(function (s) { return (counts[s.name] || 0) + " " + s.name; });
    function list(a) { return a.length ? "\n- " + a.join("\n- ") : " none."; }
    out.push({ t: "Live board summary", k: "how many total count summary overview portfolio tasks number status", x: "There are " + tasks.length + " tasks right now: " + parts.join(", ") + "." });
    out.push({ t: "Live overdue tasks", k: "overdue late tasks which list now current", x: lists.overdue.length + " overdue task(s):" + list(lists.overdue) });
    out.push({ t: "Live blocked tasks", k: "blocked tasks which list now current stuck", x: lists.blocked.length + " blocked task(s):" + list(lists.blocked) });
    out.push({ t: "Live critical tasks", k: "critical urgent tasks which list now current open", x: lists.critical.length + " open Critical task(s):" + list(lists.critical) });
    return out;
  }

  /* ---------- retrieval: tf-idf style scoring over title, keywords and text ---------- */
  var STOP = "a an the is are was be to of in on at for and or do does did i you me my it this that how what which who where when can with about any there tell show please".split(" ");
  function tokens(s) {
    return (s.toLowerCase().match(/[a-z0-9]+/g) || []).filter(function (w) { return STOP.indexOf(w) < 0; }).map(function (w) {
      return w.length > 4 ? w.replace(/(ing|ed|es|s)$/, "") : w.replace(/s$/, "");
    });
  }
  function retrieve(query, docs) {
    var q = tokens(query), n = docs.length;
    if (!q.length) return [];
    var bags = docs.map(function (d) {
      return { title: tokens(d.t), keys: tokens(d.k), body: tokens(d.x) };
    });
    function has(a, w) { return a.indexOf(w) >= 0; }
    var scored = docs.map(function (d, i) {
      var b = bags[i], s = 0;
      q.forEach(function (w) {
        var df = 0;
        bags.forEach(function (o) { if (has(o.title, w) || has(o.keys, w) || has(o.body, w)) df++; });
        var idf = Math.log(1 + n / (1 + df));
        s += idf * ((has(b.title, w) ? 3 : 0) + (has(b.keys, w) ? 2 : 0) + (has(b.body, w) ? 1 : 0));
      });
      return { doc: d, score: s };
    }).filter(function (r) { return r.score > 0; });
    scored.sort(function (a, b) { return b.score - a.score; });
    return scored;
  }

  /* generation step: compose the reply from the top retrieved chunks */
  function answer(query) {
    var hits = retrieve(query, KB.concat(liveChunks()));
    if (!hits.length || hits[0].score < 1.2) {
      return { text: "I could not find that in my knowledge base. Try asking about statuses, priorities, overdue or blocked tasks, adding or moving a task.", src: [] };
    }
    var pick = [hits[0]];
    if (hits[1] && hits[1].score >= hits[0].score * 0.75) pick.push(hits[1]);
    return { text: pick.map(function (h) { return h.doc.x; }).join("\n\n"), src: pick.map(function (h) { return h.doc.t; }) };
  }

  /* ---------- voice (built-in speech synthesis, triggered by the launcher click) ---------- */
  var speaking = false, muted = false;
  function speak(text, onState) {
    if (muted || !("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") return;
    try {
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      var voices = window.speechSynthesis.getVoices();
      for (var i = 0; i < voices.length; i++) { if (/^en/i.test(voices[i].lang)) { u.voice = voices[i]; break; } }
      u.lang = u.voice ? u.voice.lang : "en-US";
      u.pitch = 0.9; u.rate = 1;
      u.onstart = function () { speaking = true; onState(true); };
      u.onend = u.onerror = function () { speaking = false; onState(false); };
      window.speechSynthesis.speak(u);
    } catch (e) { /* voice is optional */ }
  }
  function stopSpeech() { try { window.speechSynthesis.cancel(); } catch (e) {} }

  /* ---------- UI ---------- */
  var root = document.createElement("div");
  root.className = "cb-root";
  root.innerHTML =
    '<section class="cb-panel" id="cb-panel" role="dialog" aria-label="IT assistant chat" hidden>' +
      '<header class="cb-head"><span class="cb-av">' + AVATAR + '</span>' +
        '<div class="cb-title"><b>NEXUS-IT</b><span>// online · local knowledge base</span></div>' +
        '<button type="button" class="cb-icon-btn" id="cb-mute" aria-pressed="false" aria-label="Mute voice" title="Mute voice">🔊</button>' +
        '<button type="button" class="cb-icon-btn" id="cb-close" aria-label="Close chat" title="Close">✕</button></header>' +
      '<div class="cb-log" id="cb-log" role="log" aria-live="polite"></div>' +
      '<div class="cb-chips" id="cb-chips"></div>' +
      '<form class="cb-form" id="cb-form" autocomplete="off">' +
        '<input class="cb-input" id="cb-input" type="text" maxlength="200" placeholder="Ask the IT assistant…" aria-label="Your question">' +
        '<button type="submit" class="cb-send">SEND</button></form>' +
    '</section>' +
    '<button type="button" class="cb-launch" id="cb-launch" aria-expanded="false" aria-controls="cb-panel" aria-label="Open IT assistant chat">' + AVATAR + '<span class="cb-badge">AI</span></button>';
  document.body.appendChild(root);

  var panel = root.querySelector("#cb-panel"), launch = root.querySelector("#cb-launch"),
      log = root.querySelector("#cb-log"), input = root.querySelector("#cb-input"),
      form = root.querySelector("#cb-form"), chips = root.querySelector("#cb-chips"),
      muteBtn = root.querySelector("#cb-mute"), greeted = false;

  function setSpeaking(on) { root.classList.toggle("cb-speaking", on); }

  function addMsg(who, text, src) {
    var m = document.createElement("div");
    m.className = "cb-msg " + (who === "user" ? "cb-user" : "cb-bot");
    m.textContent = text; // textContent: user text is never parsed as HTML
    if (src && src.length) {
      var s = document.createElement("span");
      s.className = "cb-src";
      s.textContent = "source: " + src.join(" + ");
      m.appendChild(s);
    }
    log.appendChild(m);
    log.scrollTop = log.scrollHeight;
  }

  function ask(q) {
    q = q.trim();
    if (!q) return;
    addMsg("user", q);
    var a = answer(q);
    addMsg("bot", a.text, a.src);
  }

  ["How do I add a task?", "Any overdue tasks?", "What does Blocked mean?", "Priority guide"].forEach(function (q) {
    var b = document.createElement("button");
    b.type = "button"; b.className = "cb-chip"; b.textContent = q;
    b.addEventListener("click", function () { ask(q); input.focus(); });
    chips.appendChild(b);
  });

  function openChat() {
    panel.hidden = false;
    root.classList.add("cb-open");
    launch.setAttribute("aria-expanded", "true");
    launch.setAttribute("aria-label", "Close IT assistant chat");
    if (!greeted) { greeted = true; addMsg("bot", GREETING + "?"); }
    speak(GREETING, setSpeaking);   // the click hook: voice message
    input.focus();
  }
  function closeChat() {
    panel.hidden = true;
    root.classList.remove("cb-open");
    launch.setAttribute("aria-expanded", "false");
    launch.setAttribute("aria-label", "Open IT assistant chat");
    stopSpeech(); setSpeaking(false);
    launch.focus();
  }

  launch.addEventListener("click", function () { if (panel.hidden) openChat(); else closeChat(); });
  root.querySelector("#cb-close").addEventListener("click", closeChat);
  muteBtn.addEventListener("click", function () {
    muted = !muted;
    muteBtn.setAttribute("aria-pressed", String(muted));
    muteBtn.textContent = muted ? "🔇" : "🔊";
    muteBtn.setAttribute("aria-label", muted ? "Unmute voice" : "Mute voice");
    if (muted) { stopSpeech(); setSpeaking(false); }
  });
  form.addEventListener("submit", function (e) { e.preventDefault(); ask(input.value); input.value = ""; });
  panel.addEventListener("keydown", function (e) { if (e.key === "Escape") closeChat(); });
})();
