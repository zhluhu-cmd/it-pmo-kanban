/* IT meeting notice hook (v2 site).
   Source of truth for the popup logic. A copy is inlined at the bottom of
   index.html (between the MEETING-POPUP markers) because the page must work
   from file:// as a single file. If you edit this file, update that copy too.
   Reuses the page's .modal-backdrop / .modal / .btn styles. No persistence:
   the notice shows once per page load, 10 seconds after the page opens. */
(function () {
  "use strict";
  var DELAY_MS = 10000;

  function show() {
    // Don't stack on top of the Add Task dialog; try again shortly.
    var addTask = document.getElementById("modal");
    if (addTask && !addTask.hidden) { setTimeout(show, 1000); return; }

    var lastFocused = document.activeElement;
    var backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop meeting-backdrop";
    backdrop.innerHTML =
      '<div class="modal meeting-modal" role="alertdialog" aria-modal="true" ' +
      'aria-labelledby="meeting-title" aria-describedby="meeting-desc">' +
        '<div class="meeting-icon" aria-hidden="true">📅</div>' +
        '<p class="meeting-tag">Mandatory</p>' +
        '<h2 id="meeting-title">IT Meeting Next Week</h2>' +
        '<dl class="meeting-facts" id="meeting-desc">' +
          '<div><dt>When</dt><dd>Next week, 10:00 AM</dd></div>' +
          '<div><dt>Where</dt><dd>Room 888</dd></div>' +
        '</dl>' +
        '<p class="meeting-note">Attendance is mandatory for all IT staff.</p>' +
        '<div class="form-actions"><button type="button" class="btn" id="meeting-ok">Got it, I\'ll be there</button></div>' +
      '</div>';
    document.body.appendChild(backdrop);

    var ok = backdrop.querySelector("#meeting-ok");
    function close() {
      document.removeEventListener("keydown", onKey);
      backdrop.remove();
      if (lastFocused && document.body.contains(lastFocused)) lastFocused.focus();
    }
    function onKey(e) {
      if (e.key === "Escape") close();
      else if (e.key === "Tab") { e.preventDefault(); ok.focus(); } // single control: keep focus in dialog
    }
    ok.addEventListener("click", close);
    document.addEventListener("keydown", onKey);
    ok.focus();
  }

  setTimeout(show, DELAY_MS);
})();
