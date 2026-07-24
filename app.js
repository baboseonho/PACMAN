"use strict";

(() => {
  const $ = (id) => document.getElementById(id);
  const STORAGE_KEY = "game-ai-lab-progress-v1";
  const THEME_STORAGE_KEY = "game-ai-lab-theme-v1";
  const TOTAL = COURSE_MISSIONS.length;

  const els = {
    missionNav: $("missionNav"), courseProgress: $("courseProgress"), progressLabel: $("progressLabel"), progressPercent: $("progressPercent"), progressBar: $("progressBar"),
    missionPhase: $("missionPhase"),
    missionTitle: $("missionTitle"), missionLead: $("missionLead"), conceptIcon: $("conceptIcon"), conceptTitle: $("conceptTitle"), conceptText: $("conceptText"),
    codeReference: $("codeReference"), missionGuide: $("missionGuide"),
    taskTitle: $("taskTitle"), taskPrompt: $("taskPrompt"), answerArea: $("answerArea"), hintHistory: $("hintHistory"), feedback: $("feedback"), attemptsLabel: $("attemptsLabel"),
    hintBtn: $("hintBtn"), hintCount: $("hintCount"), checkBtn: $("checkBtn"), skipBtn: $("skipBtn"), prevBtn: $("prevBtn"), nextBtn: $("nextBtn"),
    themeToggleBtn: $("themeToggleBtn"), themeIcon: $("themeIcon"),
    completeDialog: $("completeDialog"), resultMissions: $("resultMissions"), resultSkipped: $("resultSkipped"), resultHints: $("resultHints"),
    toast: $("toast"), fsmTab: $("fsmTab"), matrixTab: $("matrixTab"), pathTab: $("pathTab"), playTab: $("playTab"), buildTab: $("buildTab"),
    fsmLab: $("fsmLab"), matrixLab: $("matrixLab"), pathLab: $("pathLab"), playLab: $("playLab"), buildLab: $("buildLab"),
    buildGrid: $("buildGrid"), buildSize: $("buildSize"), buildSizeValue: $("buildSizeValue"), buildStatus: $("buildStatus"),
    buildTools: $("buildTools"), playBuildBtn: $("playBuildBtn"), clearBuildBtn: $("clearBuildBtn"), playgroundMapOption: $("playgroundMapOption"),
    distanceLine: $("distanceLine"), distanceSlider: $("distanceSlider"), distanceValue: $("distanceValue"), currentState: $("currentState"), stateReason: $("stateReason"),
    matrixGrid: $("matrixGrid"), matrixStatus: $("matrixStatus"), matrixSize: $("matrixSize"), matrixFloor: $("matrixFloor"), matrixWalls: $("matrixWalls"),
    matrixPacmanPos: $("matrixPacmanPos"), matrixGhostPos: $("matrixGhostPos"), matrixGhost2Pos: $("matrixGhost2Pos"), matrixDistance: $("matrixDistance"), runMatrixLabBtn: $("runMatrixLabBtn"),
    mapTabs: $("mapTabs"), pathGrid: $("pathGrid"), pathStatus: $("pathStatus"), stepPathBtn: $("stepPathBtn"), runPathBtn: $("runPathBtn"),
    resetPathBtn: $("resetPathBtn"), editCostBtn: $("editCostBtn"), speedSelect: $("speedSelect"), frontierMetric: $("frontierMetric"),
    visitedMetric: $("visitedMetric"), costMetric: $("costMetric"), gameCanvas: $("gameCanvas"), gameScore: $("gameScore"), gameLives: $("gameLives"),
    aiBuild: $("aiBuild"), gameMainState: $("gameMainState"), gamePlayBtn: $("gamePlayBtn"), gamePauseBtn: $("gamePauseBtn"),
    gameRestartBtn: $("gameRestartBtn"), gameSoundBtn: $("gameSoundBtn"), gameMapSelect: $("gameMapSelect"), studentMapOption: $("studentMapOption"), gameOverlay: $("gameOverlay"),
    ghostMonitor: $("ghostMonitor"), aiFeatureList: $("aiFeatureList"), runtimeStatus: $("runtimeStatus"), dijkstraGuideDialog: $("dijkstraGuideDialog"),
    dijkstraGuideFrame: $("dijkstraGuideFrame"), openDijkstraGuideBtn: $("openDijkstraGuideBtn"), closeDijkstraGuideBtn: $("closeDijkstraGuideBtn")
  };

  let store = loadStore();
  let currentIndex = 0;
  let selectedChoice = "";
  let orderAnswer = [];
  let tripleAnswer = [];
  let toastTimer = null;

  function emptyProfile() {
    return { current: 0, completed: [], skipped: [], attempts: {}, hints: {}, drafts: {}, studentMapCode: "", gameMapIndex: 0, playground: null, playgroundPlayed: false, fsmRanges: null };
  }

  function loadStore() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (parsed?.profile) return parsed;
      if (parsed?.profiles?.advanced) return { profile: parsed.profiles.advanced };
    } catch (_) { /* start fresh */ }
    return { profile: emptyProfile() };
  }

  function saveStore() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }

  function applyTheme(theme, persist = true) {
    const resolved = theme === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = resolved;
    document.documentElement.style.colorScheme = resolved;
    if (persist) {
      try { localStorage.setItem(THEME_STORAGE_KEY, resolved); } catch (_) { /* theme still works for this visit */ }
    }
    const dark = resolved === "dark";
    els.themeIcon.textContent = dark ? "☀" : "☾";
    els.themeToggleBtn.setAttribute("aria-pressed", String(dark));
    els.themeToggleBtn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    els.themeToggleBtn.title = dark ? "Switch to light mode" : "Switch to dark mode";
  }

  function profile() { return store.profile; }
  function mission() { return COURSE_MISSIONS[currentIndex]; }
  function variant() { return mission().task; }

  function renderAll() {
    const p = profile();
    p.current = currentIndex;
    saveStore();
    renderProgress();
    renderNav();
    renderMission();
  }

  function renderProgress() {
    const complete = profile().completed.length;
    const percent = Math.round((complete / TOTAL) * 100);
    els.progressLabel.textContent = `Mission ${currentIndex + 1} of ${TOTAL}`;
    els.progressPercent.textContent = `${percent}%`;
    els.progressBar.style.width = `${percent}%`;
    els.courseProgress.setAttribute("aria-valuenow", String(percent));
  }

  function renderNav() {
    const p = profile();
    els.missionNav.replaceChildren();
    COURSE_MISSIONS.forEach((item, index) => {
      const complete = p.completed.includes(item.id);
      const skipped = (p.skipped || []).includes(item.id);
      // Missions 1–6 are freely accessible (session 2 starts at 6); from mission 7 on,
      // each mission unlocks only after the previous one is completed.
      const unlocked = index <= 5 || complete || p.completed.includes(COURSE_MISSIONS[index - 1].id);
      const button = document.createElement("button");
      button.className = `nav-mission${index === currentIndex ? " active" : ""}${complete ? " complete" : ""}${skipped ? " skipped" : ""}`;
      if (index === currentIndex) button.setAttribute("aria-current", "step");
      button.disabled = !unlocked;
      button.innerHTML = `<span class="nav-num">${skipped ? "↷" : complete ? "✓" : String(index + 1).padStart(2, "0")}</span><span class="nav-copy"><strong>${item.nav}</strong><small>${item.lab.toUpperCase()} lab</small></span><span class="nav-lock">${skipped ? "SKIP" : unlocked ? "" : "LOCK"}</span>`;
      button.addEventListener("click", () => {
        currentIndex = index;
        renderAll();
        document.querySelector(".lesson-panel").scrollTop = 0;
      });
      els.missionNav.append(button);
    });
  }

  function renderMission() {
    const item = mission();
    const task = variant();
    const p = profile();
    selectedChoice = "";
    orderAnswer = [];
    tripleAnswer = [];
    els.missionPhase.textContent = item.phase;
    els.missionTitle.textContent = item.title;
    els.missionLead.textContent = item.lead;
    els.conceptIcon.textContent = item.icon;
    els.conceptTitle.textContent = item.conceptTitle;
    els.conceptText.textContent = item.conceptText;
    renderCodeReference(item.codeReference);
    renderMissionGuide(item.guide);
    els.taskTitle.textContent = task.taskTitle;
    els.taskPrompt.textContent = task.prompt;
    els.feedback.textContent = "";
    els.feedback.className = "feedback";
    els.attemptsLabel.textContent = `${p.attempts[item.id] || 0} attempts`;
    els.hintCount.textContent = `${p.hints[item.id] || 0}/3`;
    renderHintHistory();
    els.prevBtn.disabled = currentIndex === 0;
    const done = p.completed.includes(item.id);
    const skipped = (p.skipped || []).includes(item.id);
    els.nextBtn.disabled = !done;
    els.nextBtn.textContent = currentIndex === TOTAL - 1 ? "View result →" : "Next mission →";
    els.checkBtn.textContent = task.validator === "matrixMap" ? "Run map" : task.type === "build" ? "Check level" : "Check answer";
    els.runMatrixLabBtn.hidden = task.validator !== "matrixMap";
    renderAnswer(task, p.drafts[item.id]);
    if (item.lab === "matrix") {
      const matrixDraft = task.validator === "matrixMap" ? p.drafts[item.id] : p.drafts.matrix;
      const savedMatrix = parseMatrixCode(matrixDraft || "");
      if (savedMatrix.ok) renderStudentMatrix(savedMatrix);
    }
    const labOrder = ["play", "fsm", "fsm", "matrix", "matrix", "path", "path", "path", "play", "play", "play", "build"];
    openLab(labOrder[currentIndex] || "play");
    if (item.id === "cost" && pathState.mapIndex !== 1) loadMap(1);
    if (done) setFeedback(skipped ? "hint" : "success", skipped ? "This mission was skipped. You may continue, or submit a correct answer later to replace SKIP with a completed check." : "Completed. You may review the task or continue to the next mission.");
  }

  function renderCodeReference(reference) {
    els.codeReference.replaceChildren();
    els.codeReference.hidden = !reference?.length;
    if (!reference?.length) return;

    const heading = document.createElement("div");
    heading.className = "code-reference-head";
    const label = document.createElement("span");
    label.className = "card-label";
    label.textContent = "Code reference";
    const title = document.createElement("h3");
    title.id = "codeReferenceTitle";
    title.textContent = "Names used in this mission";
    const intro = document.createElement("p");
    intro.textContent = "Read what each name does, then write the logic yourself.";
    heading.append(label, title, intro);

    const terms = document.createElement("dl");
    terms.className = "code-reference-grid";
    reference.forEach(([name, meaning]) => {
      const item = document.createElement("div");
      const term = document.createElement("dt");
      const code = document.createElement("code");
      code.textContent = name;
      term.append(code);
      const description = document.createElement("dd");
      description.textContent = meaning;
      item.append(term, description);
      terms.append(item);
    });
    els.codeReference.append(heading, terms);
  }

  function renderMissionGuide(guide) {
    els.missionGuide.replaceChildren();
    els.missionGuide.hidden = !guide;
    if (!guide) return;

    const heading = document.createElement("div");
    heading.className = "mission-guide-head";
    const label = document.createElement("span");
    label.className = "card-label";
    label.textContent = "Before you code";
    const title = document.createElement("h3");
    title.textContent = guide.title;
    const intro = document.createElement("p");
    intro.textContent = guide.intro;
    heading.append(label, title, intro);

    const terms = document.createElement("dl");
    terms.className = "mission-term-grid";
    guide.terms.forEach(([name, meaning]) => {
      const item = document.createElement("div");
      const term = document.createElement("dt");
      const code = document.createElement("code");
      code.textContent = name;
      term.append(code);
      const description = document.createElement("dd");
      description.textContent = meaning;
      item.append(term, description);
      terms.append(item);
    });

    const example = document.createElement("article");
    example.className = "mission-example";
    const exampleTitle = document.createElement("h4");
    exampleTitle.textContent = guide.exampleTitle;
    const exampleText = document.createElement("p");
    exampleText.textContent = guide.exampleText;
    const exampleCode = document.createElement("pre");
    const exampleCodeContent = document.createElement("code");
    exampleCodeContent.textContent = guide.exampleCode;
    exampleCode.append(exampleCodeContent);
    const exampleResult = document.createElement("p");
    exampleResult.className = "mission-example-result";
    exampleResult.textContent = guide.exampleResult;
    example.append(exampleTitle, exampleText, exampleCode, exampleResult);

    const workflow = document.createElement("div");
    workflow.className = "mission-workflow";
    const workflowTitle = document.createElement("h4");
    workflowTitle.textContent = "Mission 8 checklist";
    const list = document.createElement("ol");
    guide.steps.forEach((step) => {
      const item = document.createElement("li");
      item.textContent = step;
      list.append(item);
    });
    workflow.append(workflowTitle, list);
    els.missionGuide.append(heading, terms, example, workflow);
  }

  function renderAnswer(task, draft) {
    els.answerArea.replaceChildren();
    if (task.type === "choice") renderChoice(task, draft);
    if (task.type === "triple") renderTriple(task, draft);
    if (task.type === "order") renderOrder(task, draft);
    if (task.type === "code") renderCode(task, draft);
    if (task.type === "build") renderBuildTask();
  }

  let buildChecklistEl = null;

  function renderBuildTask() {
    const wrap = document.createElement("div");
    wrap.className = "build-task";
    buildChecklistEl = document.createElement("ul");
    buildChecklistEl.className = "build-checklist";
    const openBtn = document.createElement("button");
    openBtn.className = "button ghost";
    openBtn.textContent = "Open Build lab →";
    openBtn.addEventListener("click", () => openLab("build"));
    wrap.append(buildChecklistEl, openBtn);
    els.answerArea.append(wrap);
    updateBuildChecklist();
  }

  function updateBuildChecklist() {
    if (!buildChecklistEl || !buildChecklistEl.isConnected) return;
    const status = playgroundStatus();
    buildChecklistEl.replaceChildren();
    status.checks.forEach(([done, label]) => {
      const item = document.createElement("li");
      item.className = done ? "done" : "";
      item.textContent = `${done ? "✓" : "○"} ${label}`;
      buildChecklistEl.append(item);
    });
  }

  function renderChoice(task, draft) {
    selectedChoice = typeof draft === "string" ? draft : "";
    const grid = document.createElement("div");
    grid.className = "choice-grid";
    task.options.forEach((option, index) => {
      const button = document.createElement("button");
      button.className = `choice-option${selectedChoice === option ? " selected" : ""}`;
      button.innerHTML = `<strong>${String.fromCharCode(65 + index)}.</strong> ${option}`;
      button.addEventListener("click", () => {
        selectedChoice = option;
        profile().drafts[mission().id] = option;
        saveStore();
        grid.querySelectorAll(".choice-option").forEach((item) => item.classList.remove("selected"));
        button.classList.add("selected");
      });
      grid.append(button);
    });
    els.answerArea.append(grid);
  }

  function renderTriple(task, draft) {
    tripleAnswer = Array.isArray(draft) ? [...draft] : task.labels.map(() => "");
    const grid = document.createElement("div");
    grid.className = "triple-grid";
    task.labels.forEach((label, index) => {
      const wrap = document.createElement("label");
      wrap.className = "mini-select";
      wrap.append(document.createTextNode(label));
      const select = document.createElement("select");
      select.innerHTML = `<option value="">Choose…</option>${task.choices.map((choice) => `<option>${choice}</option>`).join("")}`;
      select.value = tripleAnswer[index] || "";
      select.addEventListener("change", () => {
        tripleAnswer[index] = select.value;
        profile().drafts[mission().id] = tripleAnswer;
        saveStore();
      });
      wrap.append(select);
      grid.append(wrap);
    });
    els.answerArea.append(grid);
  }

  function renderOrder(task, draft) {
    orderAnswer = Array.isArray(draft) ? draft.filter((line) => task.lines.includes(line)) : [];
    const answer = document.createElement("div");
    const bank = document.createElement("div");
    answer.className = "order-answer";
    bank.className = "order-bank";
    const refresh = () => {
      answer.replaceChildren();
      bank.replaceChildren();
      orderAnswer.forEach((line) => answer.append(makeOrderChip(line, () => {
        orderAnswer.splice(orderAnswer.indexOf(line), 1); persist(); refresh();
      })));
      task.lines.filter((line) => !orderAnswer.includes(line)).forEach((line) => bank.append(makeOrderChip(line, () => {
        orderAnswer.push(line); persist(); refresh();
      })));
    };
    const persist = () => { profile().drafts[mission().id] = orderAnswer; saveStore(); };
    els.answerArea.append(answer, bank);
    refresh();
  }

  function makeOrderChip(text, action) {
    const button = document.createElement("button");
    button.className = "order-chip";
    button.textContent = text;
    button.addEventListener("click", action);
    return button;
  }

  const PYTHON_COMPLETIONS = [
    { label: "if", insert: "if", detail: "Python keyword" },
    { label: "elif", insert: "elif", detail: "Python keyword" },
    { label: "else", insert: "else", detail: "Python keyword" },
    { label: "def", insert: "def", detail: "Python keyword" },
    { label: "return", insert: "return", detail: "Python keyword" },
    { label: "for", insert: "for", detail: "Python keyword" },
    { label: "while", insert: "while", detail: "Python keyword" },
    { label: "len", insert: "len", detail: "Python built-in" },
    { label: "min", insert: "min", detail: "Python built-in" },
    { label: "abs", insert: "abs", detail: "Python built-in" },
    { label: "None", insert: "None", detail: "Python constant" },
    { label: "True", insert: "True", detail: "Python constant" },
    { label: "False", insert: "False", detail: "Python constant" }
  ];


  // Offline Python syntax highlighting: a colored layer rendered behind a
  // transparent textarea, VS Code Dark+ palette. No libraries, works offline.
  const PY_CONTROL = new Set(["if", "elif", "else", "for", "while", "return", "break", "continue", "pass"]);
  const PY_KEYWORD = new Set(["def", "class", "lambda", "in", "and", "or", "not", "is", "import", "from", "as", "with", "try", "except", "global", "del"]);
  const PY_CONSTANT = new Set(["None", "True", "False"]);
  const PY_BUILTIN = new Set(["abs", "len", "min", "max", "range", "print", "sum", "sorted", "int", "float", "str", "list", "dict", "set", "tuple"]);

  function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function highlightPython(source) {
    const pattern = /(#[^\n]*)|("""[\s\S]*?(?:"""|$)|'''[\s\S]*?(?:'''|$)|"(?:\\.|[^"\\\n])*(?:"|$)|'(?:\\.|[^'\\\n])*(?:'|$))|(\b\d+(?:\.\d+)?\b)|([A-Za-z_]\w*)|(==|!=|<=|>=|->|[+\-*/%<>=])/g;
    let out = "";
    let last = 0;
    let match;
    while ((match = pattern.exec(source))) {
      out += escapeHtml(source.slice(last, match.index));
      last = pattern.lastIndex;
      const [text, comment, string, number, word, operator] = match;
      let cls = "";
      if (comment) cls = "comment";
      else if (string) cls = "string";
      else if (number) cls = "number";
      else if (word) {
        if (PY_CONTROL.has(word)) cls = "control";
        else if (PY_KEYWORD.has(word)) cls = "keyword";
        else if (PY_CONSTANT.has(word)) cls = "constant";
        else if (PY_BUILTIN.has(word)) cls = "builtin";
        else if (/^[A-Z][A-Z0-9_]*$/.test(word)) cls = "caps";
        else if (/^\s*\(/.test(source.slice(last))) cls = "func";
      } else if (operator) cls = "op";
      out += cls ? `<span class="tok-${cls}">${escapeHtml(text)}</span>` : escapeHtml(text);
    }
    out += escapeHtml(source.slice(last));
    return out;
  }

  function renderCode(task, draft) {
    const editor = document.createElement("div");
    editor.className = "code-editor";
    const surface = document.createElement("div");
    surface.className = "code-surface";
    const highlight = document.createElement("pre");
    highlight.className = "code-highlight";
    highlight.setAttribute("aria-hidden", "true");
    const highlightCode = document.createElement("code");
    highlight.append(highlightCode);
    const textarea = document.createElement("textarea");
    textarea.className = "code-input";
    textarea.spellcheck = false;
    textarea.value = typeof draft === "string" ? draft : (task.starter || "");
    textarea.setAttribute("aria-label", "Code answer");
    textarea.setAttribute("aria-autocomplete", "list");
    textarea.setAttribute("aria-expanded", "false");
    const suggestions = document.createElement("div");
    suggestions.className = "code-suggestions";
    suggestions.id = "codeSuggestions-" + mission().id;
    suggestions.setAttribute("role", "listbox");
    suggestions.setAttribute("aria-label", "Python code suggestions");
    suggestions.hidden = true;
    textarea.setAttribute("aria-controls", suggestions.id);
    let visibleSuggestions = [];
    let activeSuggestion = 0;
    let prefixStart = 0;

    const completionPrefix = () => {
      const before = textarea.value.slice(0, textarea.selectionStart);
      const match = before.match(/[A-Za-z_][A-Za-z0-9_.]*$/);
      return match ? { text: match[0], start: textarea.selectionStart - match[0].length } : { text: "", start: textarea.selectionStart };
    };

    const usedWordCompletions = (beforeIndex) => {
      const words = textarea.value.slice(0, beforeIndex).match(/[A-Za-z_][A-Za-z0-9_.]*/g) || [];
      const pythonKeywords = new Set(["if", "elif", "else", "def", "return", "for", "while", "in", "and", "or", "not", "true", "false", "none"]);
      return [...new Set(words)]
        .filter((word) => word.length > 2 && !pythonKeywords.has(word.toLowerCase()))
        .map((word) => ({ label: word, insert: word, detail: "Used earlier in this answer" }));
    };

    const hideSuggestions = () => {
      visibleSuggestions = [];
      suggestions.hidden = true;
      suggestions.replaceChildren();
      textarea.setAttribute("aria-expanded", "false");
      textarea.removeAttribute("aria-activedescendant");
    };

    const setActiveSuggestion = (index) => {
      if (!visibleSuggestions.length) return;
      activeSuggestion = (index + visibleSuggestions.length) % visibleSuggestions.length;
      suggestions.querySelectorAll(".code-suggestion").forEach((button, buttonIndex) => {
        const active = buttonIndex === activeSuggestion;
        button.classList.toggle("active", active);
        button.setAttribute("aria-selected", String(active));
        if (active) {
          textarea.setAttribute("aria-activedescendant", button.id);
          button.scrollIntoView({ block: "nearest" });
        }
      });
    };

    const acceptSuggestion = (index = activeSuggestion) => {
      const suggestion = visibleSuggestions[index];
      if (!suggestion) return;
      textarea.setRangeText(suggestion.insert, prefixStart, textarea.selectionStart, "end");
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
      hideSuggestions();
      textarea.focus();
    };

    const resizeEditor = () => {
      const maximum = 640;
      textarea.style.height = "auto";
      const nextHeight = Math.min(Math.max(textarea.scrollHeight, 280), maximum);
      textarea.style.height = nextHeight + "px";
      textarea.style.overflowY = textarea.scrollHeight > maximum ? "auto" : "hidden";
    };

    const updateSuggestions = () => {
      const prefix = completionPrefix();
      prefixStart = prefix.start;
      const query = prefix.text.toLowerCase();
      if (!query) { hideSuggestions(); return; }
      const pool = [...usedWordCompletions(prefix.start), ...PYTHON_COMPLETIONS];
      const seen = new Set();
      visibleSuggestions = pool.filter((item) => {
        const key = item.insert.toLowerCase();
        const matches = item.label.toLowerCase().startsWith(query) || key.startsWith(query);
        if (!matches || key === query || seen.has(key)) return false;
        seen.add(key);
        return true;
      }).slice(0, 6);
      if (!visibleSuggestions.length) { hideSuggestions(); return; }
      activeSuggestion = 0;
      suggestions.replaceChildren();
      visibleSuggestions.forEach((item, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "code-suggestion" + (index === 0 ? " active" : "");
        button.id = suggestions.id + "-" + index;
        button.setAttribute("role", "option");
        button.setAttribute("aria-selected", String(index === 0));
        const code = document.createElement("code");
        code.textContent = item.label;
        const detail = document.createElement("span");
        detail.textContent = item.detail;
        button.append(code, detail);
        button.addEventListener("mousedown", (event) => event.preventDefault());
        button.addEventListener("click", () => acceptSuggestion(index));
        suggestions.append(button);
      });
      suggestions.hidden = false;
      textarea.setAttribute("aria-expanded", "true");
      textarea.setAttribute("aria-activedescendant", suggestions.firstElementChild.id);
    };
    const renderHighlight = () => {
      highlightCode.innerHTML = highlightPython(textarea.value + "\n");
      highlight.scrollTop = textarea.scrollTop;
    };
    textarea.addEventListener("scroll", () => { highlight.scrollTop = textarea.scrollTop; });
    textarea.addEventListener("input", () => {
      profile().drafts[mission().id] = textarea.value;
      saveStore();
      renderHighlight();
      resizeEditor();
      updateSuggestions();
    });
    textarea.addEventListener("click", updateSuggestions);
    textarea.addEventListener("keyup", (event) => {
      if (["ArrowUp", "ArrowDown", "Enter", "Tab", "Escape"].includes(event.key)) return;
      updateSuggestions();
    });
    textarea.addEventListener("keydown", (event) => {
      if (!suggestions.hidden && event.key === "ArrowDown") {
        event.preventDefault();
        setActiveSuggestion(activeSuggestion + 1);
        return;
      }
      if (!suggestions.hidden && event.key === "ArrowUp") {
        event.preventDefault();
        setActiveSuggestion(activeSuggestion - 1);
        return;
      }
      if (!suggestions.hidden && (event.key === "Enter" || event.key === "Tab") && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        acceptSuggestion();
        return;
      }
      if (!suggestions.hidden && event.key === "Escape") {
        event.preventDefault();
        hideSuggestions();
        return;
      }
      if (event.key === "Tab") {
        event.preventDefault();
        const start = textarea.selectionStart;
        textarea.setRangeText("    ", start, textarea.selectionEnd, "end");
        textarea.dispatchEvent(new Event("input"));
      }
      if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) checkAnswer();
    });
    textarea.addEventListener("blur", () => window.setTimeout(hideSuggestions, 120));
    surface.append(highlight, textarea);
    editor.append(surface, suggestions);
    els.answerArea.append(editor);
    const note = document.createElement("div");
    note.className = "task-note";
    note.textContent = "Autocomplete suggests Python keywords and names already used above. Your operators and code are never changed.";
    els.answerArea.append(note);
    requestAnimationFrame(() => {
      renderHighlight();
      resizeEditor();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    });
  }

  function currentAnswer() {
    const task = variant();
    if (task.type === "choice") return selectedChoice;
    if (task.type === "triple") return tripleAnswer;
    if (task.type === "order") return orderAnswer;
    return els.answerArea.querySelector("textarea")?.value || "";
  }

  function checkAnswer() {
    const item = mission();
    const task = variant();
    const p = profile();
    p.attempts[item.id] = (p.attempts[item.id] || 0) + 1;
    els.attemptsLabel.textContent = `${p.attempts[item.id]} attempts`;

    const answer = currentAnswer();
    p.drafts[item.id] = answer;
    let matrixResult = null;
    if (task.type === "code") {
      const syntaxIssues = pythonSyntaxIssues(answer);
      if (syntaxIssues.length) {
        saveStore();
        setFeedback("error", "Fix Python syntax and indentation first:\n• " + syntaxIssues.slice(0, 6).join("\n• "));
        return;
      }
    }
    if (task.validator === "matrixMap") {
      matrixResult = parseMatrixCode(answer);
      if (!matrixResult.ok) {
        saveStore();
        openLab("matrix");
        setFeedback("error", "Map not built yet:\n• " + matrixResult.issues.join("\n• "));
        return;
      }
      renderStudentMatrix(matrixResult);
      openLab("matrix");
    }
    const correct = validate(task, answer);
    if (!correct) {
      saveStore();
      setFeedback("error", feedbackFor(task, answer));
      return;
    }

    const labStepsRemaining = [];
    if (task.requiresEdits && pathState.mapIndex !== 1) {
      labStepsRemaining.push("Select the WEIGHTED map. The currently selected map is not WEIGHTED.");
    } else if (task.requiresEdits && pathState.editedCells.size < task.requiresEdits) {
      labStepsRemaining.push(`Edit ${task.requiresEdits} different floor tiles. Current progress: ${pathState.editedCells.size}/${task.requiresEdits}.`);
    }
    if (task.requiresLab && !pathState.done) {
      labStepsRemaining.push("Press Run and wait until the final green path appears.");
    }
    if (labStepsRemaining.length) {
      saveStore();
      setFeedback("hint", "Your Python code is correct. Finish the Path Lab before the mission is marked complete:\n• " + labStepsRemaining.join("\n• "));
      openLab("path");
      return;
    }

    const wasSkipped = (p.skipped || []).includes(item.id);
    if (wasSkipped) p.skipped = p.skipped.filter((id) => id !== item.id);
    const newlyCompleted = !p.completed.includes(item.id);
    if (newlyCompleted) p.completed.push(item.id);
    // Mission 11 constants tune the live game: store the student's ranges.
    if (item.id === "integration") {
      const compactAnswer = compact(answer);
      const attackDef = compactAnswer.match(/attack_range=(\d+)/);
      const chaseDef = compactAnswer.match(/chase_range=(\d+)/);
      if (attackDef && chaseDef) p.fsmRanges = { attack: Number(attackDef[1]), chase: Number(chaseDef[1]) };
    }
    if (matrixResult) {
      p.studentMapCode = answer;
      p.gameMapIndex = 2;
    }
    saveStore();
    if (matrixResult) {
      syncStudentMapOption(true);
      resetGame(false);
    }
    els.nextBtn.disabled = false;
    if (task.type === "build") updateBuildChecklist();
    const rangeNote = item.id === "integration" && p.fsmRanges ? `\n\nLive game ranges applied: ATTACK < ${p.fsmRanges.attack} · CHASE < ${p.fsmRanges.chase} units.` : "";
    setFeedback("success", matrixResult ? `Playable Student map saved. P ${matrixResult.pacmanPos.join(",")}; G1 ${matrixResult.ghostPositions[0].join(",")}; G2 ${matrixResult.ghostPositions[1].join(",")}. Open Play Lab and choose Student map.` : (task.success || "Correct. The logic matches the lecture and the mission is complete.") + rangeNote);
    renderProgress();
    renderNav();
    renderGameHUD();
    game.ghosts.forEach((ghost) => { ghost.cachedPath = []; ghost.lastDecision = ""; });
    if (newlyCompleted || wasSkipped) showToast(wasSkipped ? "Skipped mission replaced with a correct answer" : matrixResult ? "Student matrix map built" : `Game AI upgraded: ${item.nav}`);
    // Mission 11 (integration) completes the smart-monster build; mission 12 is a bonus.
    if (item.id === "integration") {
      resetGame(false);
      openLab("play");
      setGameOverlay("STUDENT AI READY", "Validated FSM + Dijkstra logic is live", "PLAY", true);
      window.setTimeout(showCompletion, 350);
    }
  }

  function validate(task, answer) {
    if (task.type === "choice") return answer === task.answer;
    if (task.type === "triple" || task.type === "order") return JSON.stringify(answer) === JSON.stringify(task.answer);
    if (task.type === "build") return playgroundStatus().ok;
    return validateCode(task.validator, answer);
  }

  function compact(code) {
    return String(code).replace(/#[^\n]*/g, "").replace(/[ \t\r]/g, "").replace(/'/g, '"').toLowerCase();
  }

  function parseMatrixCode(code) {
    const withoutComments = String(code).replace(/#[^\n]*/g, "").trim();
    const assignment = withoutComments.match(/^([A-Za-z_]\w*)\s*=\s*\[([\s\S]*)\]\s*$/);
    if (!assignment) return { ok: false, issues: ["Write one Python assignment whose value is an outer list of row lists."] };

    const body = assignment[2];
    const rowPattern = /\[\s*([^\[\]]*?)\s*\]/g;
    const rows = [];
    let match;
    const normalizeToken = (raw) => {
      const token = raw.trim();
      if (token === "0" || token === "1") return Number(token);
      const marker = token.match(/^(["'])(P|G1|G2)\1$/i);
      return marker ? marker[2].toUpperCase() : null;
    };
    while ((match = rowPattern.exec(body))) {
      const rawTokens = match[1].split(",").map((value) => value.trim());
      if (!rawTokens.length || rawTokens.some((value) => !value)) {
        return { ok: false, issues: ["Each row needs comma-separated Python values without an empty item."] };
      }
      const normalized = rawTokens.map(normalizeToken);
      if (normalized.some((value) => value === null)) {
        return { ok: false, issues: ["Rows may use only 0, 1, and the quoted strings \"P\", \"G1\", and \"G2\"."] };
      }
      rows.push(normalized);
    }
    const remainder = body.replace(rowPattern, "").replace(/[\s,]/g, "");
    if (remainder) return { ok: false, issues: ["Use one bracketed Python list for each matrix row."] };
    if (!rows.length) return { ok: false, issues: ["Add at least 15 row lists inside the outer list."] };
    if (rows.length < 15 || rows.length > 25) return { ok: false, issues: ["Choose a matrix size from 15 × 15 through 25 × 25."] };

    const size = rows.length;
    const wrongRow = rows.findIndex((row) => row.length !== size);
    if (wrongRow >= 0) return { ok: false, issues: [`Row ${wrongRow + 1} has ${rows[wrongRow].length} columns, but an ${size} × ${size} matrix needs ${size}.`] };
    const flat = rows.flat();
    if (!flat.includes(0) || !flat.includes(1)) return { ok: false, issues: ["Use at least one 0 path tile and at least one 1 wall tile."] };
    const markerCount = (marker) => flat.filter((value) => value === marker).length;
    for (const marker of ["P", "G1", "G2"]) {
      const count = markerCount(marker);
      if (count !== 1) return { ok: false, issues: [`Place exactly one \"${marker}\" marker. Found: ${count}.`] };
    }
    const locate = (marker) => {
      const flatIndex = flat.indexOf(marker);
      return [Math.floor(flatIndex / size), flatIndex % size];
    };
    const pacmanPos = locate("P");
    const ghostPositions = [locate("G1"), locate("G2")];
    const walkableCount = flat.filter((value) => value !== 1).length;
    const reachable = new Set([pacmanPos.join(",")]);
    const queue = [pacmanPos];
    while (queue.length) {
      const [row, column] = queue.shift();
      [[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr, dc]) => {
        const nr = row + dr, nc = column + dc, key = `${nr},${nc}`;
        if (nr < 0 || nr >= size || nc < 0 || nc >= size || rows[nr][nc] === 1 || reachable.has(key)) return;
        reachable.add(key);
        queue.push([nr, nc]);
      });
    }
    if (reachable.size !== walkableCount) {
      return { ok: false, issues: [`Every path and character tile must connect to Pac-Man. Reachable: ${reachable.size}/${walkableCount} walkable tiles.`] };
    }
    const distances = ghostPositions.map((ghostPos) => Math.abs(pacmanPos[0] - ghostPos[0]) + Math.abs(pacmanPos[1] - ghostPos[1]));
    const unsafeGhost = distances.findIndex((distance) => distance < 8);
    if (unsafeGhost >= 0) {
      return {
        ok: false,
        issues: [`Place "G${unsafeGhost + 1}" at least 8 Manhattan tiles from "P" so the game begins safely. Current distance: ${distances[unsafeGhost]}.`]
      };
    }
    return {
      ok: true, name: assignment[1], matrix: rows, size,
      floors: flat.filter((value) => value !== 1).length, walls: flat.filter((value) => value === 1).length,
      pacmanPos, ghostPos: ghostPositions[0], ghostPositions, distance: distances[0], distances, issues: []
    };
  }

  function pythonSyntaxIssues(code) {
    const issues = [];
    const stack = [];
    const significant = [];
    const pairs = { ")": "(", "]": "[", "}": "{" };
    let bracketDepth = 0;

    String(code).split("\n").forEach((rawLine, index) => {
      const lineNumber = index + 1;
      const leading = rawLine.match(/^[ \t]*/)?.[0] || "";
      if (leading.includes("\t")) issues.push(`Line ${lineNumber}: use spaces for indentation; tabs are not accepted in this course.`);
      const spaces = leading.replace(/\t/g, "    ").length;
      const trimmed = rawLine.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      if (spaces % 4 !== 0) issues.push(`Line ${lineNumber}: indentation must use groups of 4 spaces.`);

      let quote = "";
      let escaped = false;
      let clean = "";
      const depthBefore = bracketDepth;
      for (let column = 0; column < rawLine.length; column += 1) {
        const char = rawLine[column];
        if (quote) {
          if (escaped) escaped = false;
          else if (char === "\\") escaped = true;
          else if (char === quote) quote = "";
          continue;
        }
        if (char === '"' || char === "'") { quote = char; continue; }
        if (char === "#") break;
        clean += char;
        if ("([{ ".includes(char) && char !== " ") {
          stack.push({ char, line: lineNumber });
          bracketDepth += 1;
        } else if (pairs[char]) {
          const opening = stack.pop();
          if (!opening || opening.char !== pairs[char]) issues.push(`Line ${lineNumber}: '${char}' does not match the opening bracket.`);
          else bracketDepth = Math.max(0, bracketDepth - 1);
        }
      }
      if (quote) issues.push(`Line ${lineNumber}: the string quote is not closed.`);
      if (/(?:=>|=<|=!|<>)/.test(clean)) issues.push(`Line ${lineNumber}: check the comparison operator syntax.`);
      if (/^(if|elif)\b/.test(trimmed) && /(^|[^=!<>])=([^=]|$)/.test(trimmed)) issues.push(`Line ${lineNumber}: conditions compare with ==; a single = is assignment.`);

      const blockHeader = /^(if|elif|else|def|for|while)\b/.test(trimmed);
      if (blockHeader && !trimmed.endsWith(":")) issues.push(`Line ${lineNumber}: add a colon (:) at the end of the Python block.`);
      significant.push({ line: lineNumber, indent: spaces, text: trimmed, depthBefore, depthAfter: bracketDepth, blockHeader });
    });

    stack.forEach((opening) => issues.push(`Line ${opening.line}: '${opening.char}' is not closed.`));
    significant.forEach((entry, index) => {
      if (index === 0 && entry.indent !== 0) issues.push(`Line ${entry.line}: top-level code must start without indentation.`);
      if (!index) return;
      const previous = significant[index - 1];
      if (previous.depthAfter > 0 || entry.depthBefore > 0) return;
      if (previous.blockHeader && previous.text.endsWith(":")) {
        if (entry.indent !== previous.indent + 4) issues.push(`Line ${entry.line}: the block above requires exactly ${previous.indent + 4} leading spaces.`);
      } else if (entry.indent > previous.indent) {
        issues.push(`Line ${entry.line}: unexpected indentation; the previous line did not open a block.`);
      }
    });
    const last = significant.at(-1);
    if (last?.blockHeader && last.text.endsWith(":")) issues.push(`Line ${last.line}: this block needs an indented body on the next line.`);
    return [...new Set(issues)];
  }

  function analyzeDistanceFunction(code) {
    const c = compact(code);
    const header = c.match(/defget_distance\(([a-z_]\w*),([a-z_]\w*)\):/);
    if (!header) return { ok: false, hasHeader: false, hasRow: false, hasColumn: false, hasReturn: false };
    const escaped = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const first = escaped(header[1]), second = escaped(header[2]);
    const difference = (index) => `abs\\((?:${first}\\[${index}\\]-${second}\\[${index}\\]|${second}\\[${index}\\]-${first}\\[${index}\\])\\)`;
    const rowPattern = difference(0), columnPattern = difference(1);
    const rowMatch = c.match(new RegExp(rowPattern));
    const columnMatch = c.match(new RegExp(columnPattern));
    const directReturn = new RegExp(`return(?:${rowPattern}\\+${columnPattern}|${columnPattern}\\+${rowPattern})`).test(c);
    const rowAssignment = c.match(new RegExp(`([a-z_]\\w*)=${rowPattern}`));
    const columnAssignment = c.match(new RegExp(`([a-z_]\\w*)=${columnPattern}`));
    let namedReturn = false;
    if (rowAssignment && columnAssignment) {
      const rowName = escaped(rowAssignment[1]), columnName = escaped(columnAssignment[1]);
      namedReturn = new RegExp(`return(?:${rowName}\\+${columnName}|${columnName}\\+${rowName})`).test(c);
    }
    const hasReturn = directReturn || namedReturn;
    return { ok: Boolean(rowMatch && columnMatch && hasReturn), hasHeader: true, hasRow: Boolean(rowMatch), hasColumn: Boolean(columnMatch), hasReturn };
  }

  function analyzeTileCostFunction(code) {
    const c = compact(code);
    const header = c.match(/defget_tile_cost\(([a-z_]\w*)\):/);
    if (!header) return { ok: false, hasHeader: false, wallCase: false, slimeCase: false, defaultCase: false };
    const escaped = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const tile = escaped(header[1]);
    const wallCondition = c.search(new RegExp(`${tile}==wall`));
    const wallReturn = wallCondition >= 0 ? c.indexOf("returnnone", wallCondition) : -1;
    const slimeCondition = wallReturn >= 0 ? c.search(new RegExp(`${tile}==slime`)) : -1;
    const slimeReturn = slimeCondition > wallReturn ? c.indexOf("return2", slimeCondition) : -1;
    const defaultReturn = slimeReturn >= 0 ? c.indexOf("return1", slimeReturn) : -1;
    const wallCase = wallCondition >= 0 && wallReturn > wallCondition && (slimeCondition < 0 || wallReturn < slimeCondition);
    const slimeCase = slimeCondition > wallReturn && slimeReturn > slimeCondition;
    const defaultCase = defaultReturn > slimeReturn;
    return { ok: wallCase && slimeCase && defaultCase, hasHeader: true, wallCase, slimeCase, defaultCase };
  }

  function validateCode(kind, code) {
    const c = compact(code);
    const escaped = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const orderedStates = () => {
      const first = c.match(/if([a-z_]\w*)<50:/);
      if (!first) return null;
      const distanceName = first[1];
      const attackMatch = c.slice(first.index).match(/([a-z_][a-z0-9_.]*)="attack"/);
      if (!attackMatch) return null;
      const target = attackMatch[1];
      const attack = first.index + attackMatch.index;
      const chaseCondition = c.indexOf(`elif${distanceName}<200:`, attack);
      const chase = c.indexOf(`${target}="chase"`, chaseCondition);
      const fallback = c.indexOf("else:", chase);
      const patrol = c.indexOf(`${target}="patrol"`, fallback);
      return chaseCondition > attack && chase > chaseCondition && fallback > chase && patrol > fallback ? { distanceName, target } : null;
    };

    if (kind === "matrixMap") return parseMatrixCode(code).ok;
    if (kind === "getDistance") return analyzeDistanceFunction(code).ok;
    if (kind === "tileCostFunction") return analyzeTileCostFunction(code).ok;
    if (kind === "conditionOrder") return Boolean(orderedStates());
    if (kind === "behaviorList") {
      const patrol = c.indexOf('"patrol"'), chase = c.indexOf('"chase"'), attack = c.indexOf('"attack"');
      return c.includes("=[") && patrol >= 0 && chase > patrol && attack > chase;
    }
    if (kind === "fsmDispatch") {
      const first = c.match(/if([a-z_]\w*)\.state=="patrol"/);
      if (!first) return false;
      const agent = first[1];
      const patrol = first.index, patrolCall = c.indexOf(`${agent}.patrol()`, patrol);
      const chase = c.indexOf(`${agent}.state=="chase"`, patrolCall), chaseCall = c.indexOf(`${agent}.chase_player()`, chase);
      const attack = c.indexOf(`${agent}.state=="attack"`, chaseCall), attackCall = c.indexOf(`${agent}.attack()`, attack);
      return patrolCall > patrol && chase > patrolCall && chaseCall > chase && attack > chaseCall && attackCall > attack;
    }
    if (kind === "relaxation") {
      const pick = c.match(/([a-z_]\w*)=min\(([a-z_]\w*),key=lambda([a-z_]\w*):([a-z_]\w*)\[\3\]\)/);
      if (!pick) return false;
      const current = escaped(pick[1]), distances = escaped(pick[4]);
      const addition = c.match(new RegExp(`([a-z_]\\w*)=${distances}\\[${current}\\]\\+([a-z_]\\w*)\\[([a-z_]\\w*)\\]`));
      if (!addition) return false;
      const candidate = escaped(addition[1]), nextNode = escaped(addition[3]);
      return new RegExp(`${candidate}<${distances}\\[${nextNode}\\]`).test(c) &&
        new RegExp(`${distances}\\[${nextNode}\\]=${candidate}`).test(c);
    }
    if (kind === "neighbors") {
      const loop = c.match(/for([a-z_]\w*),([a-z_]\w*)in([a-z_]\w*):/);
      if (!loop || !c.includes("(-1,0)") || !c.includes("(1,0)") || !c.includes("(0,-1)") || !c.includes("(0,1)")) return false;
      const dr = escaped(loop[1]), dc = escaped(loop[2]);
      const row = c.match(new RegExp(`([a-z_]\\w*)=([a-z_]\\w*)\\+${dr}`));
      const col = c.match(new RegExp(`([a-z_]\\w*)=([a-z_]\\w*)\\+${dc}`));
      if (!row || !col) return false;
      const nextRow = escaped(row[1]), nextCol = escaped(col[1]);
      const rowBounds = new RegExp(`0<=${nextRow}<[a-z_]\\w*`).test(c);
      const columnBounds = new RegExp(`0<=${nextCol}<[a-z_]\\w*`).test(c);
      const wall = new RegExp(`[a-z_]\\w*\\[${nextRow}\\]\\[${nextCol}\\]!=wall`).test(c);
      const append = new RegExp(`\\.append\\(\\(${nextRow},${nextCol}\\)\\)`).test(c);
      return rowBounds && columnBounds && wall && append;
    }
    if (kind === "moveOne") {
      const find = c.match(/([a-z_]\w*)=find_path\(([a-z_]\w*),([a-z_]\w*),([a-z_]\w*)\)/);
      if (!find) return false;
      const path = escaped(find[1]), position = escaped(find[3]);
      return new RegExp(`len\\(${path}\\)>1`).test(c) && new RegExp(`${position}=${path}\\[1\\]`).test(c);
    }
    if (kind === "updateGhost") {
      const header = c.match(/def([a-z_]\w*)\(([a-z_]\w*),([a-z_]\w*),([a-z_]\w*)\):/);
      if (!header) return false;
      const mapName = escaped(header[2]), position = escaped(header[3]), player = escaped(header[4]);
      const find = c.match(new RegExp(`([a-z_]\\w*)=find_path\\(${mapName},${position},${player}\\)`));
      if (!find) return false;
      const path = escaped(find[1]);
      return new RegExp(`len\\(${path}\\)>1`).test(c) && new RegExp(`return${path}\\[1\\]`).test(c) && new RegExp(`return${position}(?:\\n|$)`).test(c);
    }
    if (kind === "integration") {
      // Ranges must be named constants so students can tune them.
      const attackDef = c.match(/attack_range=(\d+)/);
      const chaseDef = c.match(/chase_range=(\d+)/);
      if (!attackDef || !chaseDef) return false;
      const attackValue = Number(attackDef[1]), chaseValue = Number(chaseDef[1]);
      if (!(attackValue > 0 && chaseValue > attackValue)) return false;
      const first = c.match(/if([a-z_]\w*)<attack_range:/);
      if (!first) return false;
      const distanceName = first[1];
      const attackAssign = c.slice(first.index).match(/([a-z_][a-z0-9_.]*)="attack"/);
      if (!attackAssign) return false;
      const target = attackAssign[1];
      const attackAt = first.index + attackAssign.index;
      const chaseCondition = c.indexOf(`elif${distanceName}<chase_range:`, attackAt);
      const chaseAt = c.indexOf(`${target}="chase"`, chaseCondition);
      const fallback = c.indexOf("else:", chaseAt);
      const patrolAt = c.indexOf(`${target}="patrol"`, fallback);
      if (!(chaseCondition > attackAt && chaseAt > chaseCondition && fallback > chaseAt && patrolAt > fallback)) return false;
      const chaseBlock = c.lastIndexOf(`${target}=="chase"`);
      if (chaseBlock < 0) return false;
      const afterChase = c.slice(chaseBlock);
      // Canonical answer: reuse the Mission 10 function inside CHASE.
      if (/([a-z_]\w*)=update_ghost\(([a-z_]\w*),\1,([a-z_]\w*)\)/.test(afterChase)) return true;
      // Long form (find_path → length check → path[1]) is still accepted.
      const findText = afterChase.match(/([a-z_]\w*)=find_path\(([a-z_]\w*),([a-z_]\w*),([a-z_]\w*)\)/);
      if (!findText) return false;
      const path = escaped(findText[1]), position = escaped(findText[3]);
      const afterFind = afterChase.slice(findText.index);
      return new RegExp(`len\\(${path}\\)>1`).test(afterFind) && new RegExp(`${position}=${path}\\[1\\]`).test(afterFind);
    }
    return false;
  }

  function codeDiagnostics(kind, code) {
    const c = compact(code);
    const issues = [...pythonSyntaxIssues(code)];
    const need = (condition, message) => { if (!condition) issues.push(message); };
    const unresolved = String(code).split("\n")
      .map((line, index) => line.includes("???") ? index + 1 : 0)
      .filter(Boolean);
    if (unresolved.length) issues.push("Line " + unresolved.join(", ") + ": replace the remaining ??? marker" + (unresolved.length > 1 ? "s" : "") + ".");

    if (kind === "matrixMap") issues.push(...parseMatrixCode(code).issues);
    if (kind === "getDistance") {
      const analysis = analyzeDistanceFunction(code);
      need(analysis.hasHeader, "Define `get_distance()` with exactly two position parameters.");
      need(analysis.hasRow, "Calculate the absolute row difference with index `[0]` and `abs()`.");
      need(analysis.hasColumn, "Calculate the absolute column difference with index `[1]` and `abs()`.");
      need(analysis.hasReturn, "Return the row difference plus the column difference.");
    }
    if (kind === "behaviorList") {
      need(c.includes("behaviors=["), "The behaviors list declaration is missing or incomplete.");
      const patrol = c.indexOf('"patrol"'), chase = c.indexOf('"chase"'), attack = c.indexOf('"attack"');
      need(patrol >= 0, "The PATROL list item is missing.");
      need(chase >= 0, "The CHASE list item is missing.");
      need(attack >= 0, "The ATTACK list item is missing.");
      if (patrol >= 0 && chase >= 0 && attack >= 0) need(patrol < chase && chase < attack, "The three behavior states are in the wrong order.");
    }
    if (kind === "fsmDispatch") {
      need(c.includes('monster.state=="patrol"'), "The PATROL state condition is missing or incorrect.");
      need(c.includes("monster.patrol()"), "The PATROL action is missing or incorrect.");
      need(c.includes('monster.state=="chase"'), "The CHASE state condition is missing or incorrect.");
      need(c.includes("monster.chase_player()"), "The CHASE action is missing or incorrect.");
      need(c.includes('monster.state=="attack"'), "The ATTACK state condition is missing or incorrect.");
      need(c.includes("monster.attack()"), "The ATTACK action is missing or incorrect.");
    }
    if (kind === "conditionOrder") {
      const d50 = c.indexOf("distance<50"), d200 = c.indexOf("distance<200");
      need(d50 >= 0, c.includes("distance<=50") ? "Use the exact Python comparison `distance < 50`; do not change it to `<=`." : "The ATTACK distance condition `distance < 50` is missing or incorrect.");
      need(d200 >= 0, c.includes("distance<=200") ? "Use the exact Python comparison `distance < 200`; do not change it to `<=`." : "The CHASE distance condition `distance < 200` is missing or incorrect.");
      if (d50 >= 0 && d200 >= 0) need(d50 < d200, "The narrower distance condition must be checked before the wider one.");
      need(c.includes('monster.state="attack"'), "The ATTACK state assignment is missing or incorrect.");
      need(c.includes('monster.state="chase"'), "The CHASE state assignment is missing or incorrect.");
      need(c.includes('monster.state="patrol"'), "The PATROL fallback assignment is missing or incorrect.");
      need(c.includes("if") && c.includes("elif") && c.includes("else:"), "The if / elif / else structure is incomplete.");
    }
    if (kind === "neighbors") {
      need(c.includes("(-1,0)") && c.includes("(1,0)") && c.includes("(0,-1)") && c.includes("(0,1)"), "The four-direction list is incomplete.");
      need(c.includes("nr=r+dr"), "The next-row calculation is missing or incorrect.");
      need(c.includes("nc=c+dc"), "The next-column calculation is missing or incorrect.");
      need(c.includes("0<=nr<rows"), "Keep the exact Python row comparison: `0 <= nr < rows`.");
      need(c.includes("0<=nc<cols"), "Keep the exact Python column comparison: `0 <= nc < cols`.");
      need(c.includes("map_data[nr][nc]!=wall"), "Keep the exact Python wall comparison: `map_data[nr][nc] != WALL`.");
      need(c.includes("append((nr,nc))"), "The valid-neighbor append step is missing or misplaced.");
    }
    if (kind === "tileCostFunction") {
      const analysis = analyzeTileCostFunction(code);
      need(analysis.hasHeader, "Define `get_tile_cost()` with one tile parameter.");
      need(analysis.wallCase, "Connect the WALL condition directly to `return None`, before numeric costs.");
      need(analysis.slimeCase, "Connect the SLIME condition directly to `return 2`, after the WALL case.");
      need(analysis.defaultCase, "Finish with `return 1` for every remaining floor tile.");
    }
    if (kind === "relaxation") {
      need(c.includes("min(frontier") && (c.includes("distance[node]") || c.includes("distances[node]")), "The frontier priority-selection part is missing or incorrect.");
      need(c.includes("new_cost=") && c.includes("+cost[next_node]"), "The accumulated-cost calculation is missing or incorrect.");
      const exactBetterCost = c.includes("new_cost<distance[next_node]") || c.includes("new_cost<distances[next_node]");
      need(exactBetterCost, c.includes("new_cost<=distance[next_node]") || c.includes("new_cost<=distances[next_node]") ? "Use the exact Python comparison `new_cost < distance[next_node]`; do not change it to `<=`." : "The better-cost comparison is missing or incorrect.");
      need(c.includes("distance[next_node]=new_cost") || c.includes("distances[next_node]=new_cost"), "The distance-record update is missing or incorrect.");
    }
    if (kind === "moveOne") {
      need(c.includes("find_path(map_data,ghost_pos,pacman_pos)"), "The pathfinding call is missing or has incorrect arguments.");
      need(c.includes("len(path)>1"), c.includes("len(path)>=1") ? "Use the exact Python comparison `len(path) > 1`; do not change it to `>=`." : "The path-length safety check is missing or incorrect.");
      need(c.includes("ghost_pos=path[1]"), "The one-tile position update is missing or incorrect.");
    }
    if (kind === "updateGhost") {
      need(c.includes("defupdate_ghost("), "The update function header is missing or incorrect.");
      need(c.includes("find_path(map_data,ghost_pos,pacman_pos)"), "The path recalculation step is missing or incorrect.");
      need(c.includes("len(path)>1"), "The path-length safety check is missing or incorrect.");
      need(c.includes("returnpath[1]"), "The next-position return is missing or incorrect.");
      need(c.includes("returnghost_pos"), "The no-path fallback return is missing or incorrect.");
    }
    if (kind === "integration") {
      const attackDef = c.match(/attack_range=(\d+)/), chaseDef = c.match(/chase_range=(\d+)/);
      need(Boolean(attackDef), "Define `ATTACK_RANGE = <number>` at the top.");
      need(Boolean(chaseDef), "Define `CHASE_RANGE = <number>` at the top.");
      if (attackDef && chaseDef) need(Number(attackDef[1]) > 0 && Number(chaseDef[1]) > Number(attackDef[1]), "Keep 0 < ATTACK_RANGE < CHASE_RANGE so the specific range stays inside the wide one.");
      const attackUse = c.indexOf("<attack_range"), chaseUse = c.indexOf("<chase_range");
      need(attackUse >= 0, "Compare with the variable: `distance < ATTACK_RANGE`, not a raw number.");
      need(chaseUse >= 0, "Compare with the variable: `distance < CHASE_RANGE`, not a raw number.");
      if (attackUse >= 0 && chaseUse >= 0) need(attackUse < chaseUse, "Check the specific `< ATTACK_RANGE` before the wider `< CHASE_RANGE`.");
      need(c.includes('ghost.state=="chase"'), "The CHASE-only navigation condition is missing or incorrect.");
      const hasReuse = c.includes("ghost_pos=update_ghost(map_data,ghost_pos,pacman_pos)");
      const hasInline = c.includes("find_path(map_data,ghost_pos,pacman_pos)") && c.includes("len(path)>1") && c.includes("ghost_pos=path[1]");
      need(hasReuse || hasInline, "Inside CHASE, move the ghost with `ghost_pos = update_ghost(map_data, ghost_pos, pacman_pos)` — reuse your Mission 10 function.");
    }
    return [...new Set(issues)];
  }

  function feedbackFor(task, answer) {
    if (task.type === "build") {
      updateBuildChecklist();
      const status = playgroundStatus();
      return "Finish these steps in the Build lab:\n• " + status.issues.join("\n• ");
    }
    if (task.type === "choice") return "Selected choice: " + (answer || "none") + "\nCheck the Key idea and compare it with the live lab.";
    if (task.type === "triple") {
      const wrong = task.labels.filter((label, index) => answer[index] !== task.answer[index]);
      return "Check these mappings:\n• " + wrong.join("\n• ");
    }
    if (task.type === "order") {
      const firstWrong = task.answer.findIndex((line, index) => answer[index] !== line);
      return "Order problem at position " + (firstWrong + 1) + ". Move the more specific or prerequisite line earlier.";
    }
    const issues = codeDiagnostics(task.validator, answer);
    if (!issues.length) return "The required parts are present, but their execution order or exact variable spelling is still different.";
    const shown = issues.slice(0, 5);
    const remaining = issues.length - shown.length;
    return "Check these parts:\n• " + shown.join("\n• ") + (remaining > 0 ? "\n• …and " + remaining + " more part" + (remaining > 1 ? "s" : "") + "." : "");
  }

  function setFeedback(type, text) {
    els.feedback.className = `feedback ${type}`;
    els.feedback.textContent = text;
  }

  function showHint() {
    const p = profile();
    const item = mission();
    const count = Math.min((p.hints[item.id] || 0) + 1, 3);
    p.hints[item.id] = count;
    saveStore();
    els.hintCount.textContent = `${count}/3`;
    renderHintHistory();
  }

  function renderHintHistory() {
    const task = variant();
    const count = Math.min(profile().hints[mission().id] || 0, 3);
    els.hintHistory.replaceChildren();
    if (!count) return;
    const title = document.createElement("strong");
    title.textContent = "Hints used";
    const list = document.createElement("ol");
    task.hints.slice(0, count).forEach((hint) => {
      const item = document.createElement("li");
      item.textContent = hint;
      list.append(item);
    });
    els.hintHistory.append(title, list);
  }

  function goNext() {
    if (!profile().completed.includes(mission().id)) return;
    if (currentIndex === TOTAL - 1) { showCompletion(); return; }
    currentIndex += 1;
    renderAll();
    document.querySelector(".lesson-panel").scrollTop = 0;
  }

  function skipCurrentMission() {
    const p = profile();
    const item = mission();
    const alreadySkipped = (p.skipped || []).includes(item.id);
    if (alreadySkipped) {
      els.nextBtn.disabled = false;
      setFeedback("hint", "This mission is already marked SKIP. Continue to the next mission or submit a correct answer later.");
      return;
    }
    if (p.completed.includes(item.id)) {
      setFeedback("success", "This mission is already completed, so it does not need to be skipped.");
      return;
    }
    if (!window.confirm("Skip this mission? Use this only when correct work is blocked by a checker or page error. The mission will be marked SKIP until a correct answer is submitted.")) return;
    p.drafts[item.id] = currentAnswer();
    p.completed.push(item.id);
    (p.skipped ||= []).push(item.id);
    saveStore();
    els.nextBtn.disabled = false;
    setFeedback("hint", "Mission skipped as a fallback. Your current work was saved. Continue now, or ask the teacher to review it later.");
    renderProgress();
    renderNav();
    renderGameHUD();
    game.ghosts.forEach((ghost) => { ghost.cachedPath = []; ghost.lastDecision = ""; });
    showToast("Mission marked SKIP · next mission unlocked");
  }

  function showCompletion() {
    const totalHints = Object.values(profile().hints).reduce((sum, value) => sum + Number(value || 0), 0);
    els.resultMissions.textContent = `${Math.min(profile().completed.length, TOTAL)} / ${TOTAL}`;
    els.resultSkipped.textContent = String((profile().skipped || []).length);
    els.resultHints.textContent = totalHints;
    if (!els.completeDialog.open) els.completeDialog.showModal();
  }

  function showToast(message) {
    window.clearTimeout(toastTimer);
    els.toast.textContent = message;
    els.toast.classList.add("show");
    toastTimer = window.setTimeout(() => els.toast.classList.remove("show"), 1700);
  }

  function stopEmbeddedGuide() {
    try { els.dijkstraGuideFrame.contentWindow?.stopAuto?.(); } catch (_) { /* iframe may still be loading */ }
  }

  function prepareEmbeddedGuide() {
    try {
      const doc = els.dijkstraGuideFrame.contentDocument;
      if (!doc || doc.getElementById("course-mobile-bridge")) return;
      const style = doc.createElement("style");
      style.id = "course-mobile-bridge";
      style.textContent = `
        main, .board-panel, .explain-panel, .card { min-width: 0; }
        @media (max-width: 640px) {
          .app { width: calc(100vw - 20px); padding-top: 14px; }
          header { grid-template-columns: minmax(0, 1fr); align-items: start; }
          h1 { font-size: 28px; line-height: 1.14; }
          .badge { justify-self: start; white-space: normal; }
          .board-panel, .explain-panel { padding: 10px; }
          .tabs { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .tab-btn { width: 100%; height: auto; min-height: 44px; padding: 7px; white-space: normal; }
          .status, .placement-label, .card p, code { overflow-wrap: anywhere; }
          .legend { grid-template-columns: 1fr; }
        }
      `;
      doc.head.append(style);
    } catch (_) { /* same-origin guide may still be loading */ }
  }

  function renderStudentMatrix(result) {
    els.matrixGrid.replaceChildren();
    els.matrixGrid.classList.remove("empty");
    const boardSize = result.size + 2;
    const boundaryWalls = boardSize * 4 - 4;
    const board = [
      Array(boardSize).fill(1),
      ...result.matrix.map((row) => [1, ...row, 1]),
      Array(boardSize).fill(1)
    ];
    const runnerPosition = result.pacmanPos.map((value) => value + 1);
    const ghostPositions = result.ghostPositions.map((position) => position.map((value) => value + 1));

    els.matrixGrid.style.gridTemplateColumns = `repeat(${boardSize}, minmax(0, 1fr))`;
    board.forEach((row, boardRow) => row.forEach((value, boardColumn) => {
      const boundary = boardRow === 0 || boardColumn === 0 || boardRow === boardSize - 1 || boardColumn === boardSize - 1;
      const cell = document.createElement("div");
      cell.className = `matrix-cell ${value === 1 ? "wall" : "floor"}${boundary ? " boundary" : ""}`;
      cell.dataset.value = String(value);
      if (boundary) {
        cell.title = `board row ${boardRow}, column ${boardColumn}: automatic boundary wall`;
      } else {
        const tileNames = { 0: "pellet path", 1: "maze wall", P: "Pac-Man start", G1: "ghost 1 start", G2: "ghost 2 start" };
        cell.title = `matrix row ${boardRow - 1}, column ${boardColumn - 1}: ${tileNames[value]}`;
      }
      if (runnerPosition && boardRow === runnerPosition[0] && boardColumn === runnerPosition[1]) {
        cell.classList.add("runner");
        const runner = document.createElement("img");
        runner.src = "assets/maze-runner-open.svg";
        runner.alt = "";
        runner.setAttribute("aria-hidden", "true");
        cell.append(runner);
      } else {
        const ghostIndex = ghostPositions.findIndex((position) => boardRow === position[0] && boardColumn === position[1]);
        if (ghostIndex >= 0) {
        cell.classList.add("ghost");
        const ghost = document.createElement("img");
        ghost.src = ghostIndex === 0 ? "assets/ghost-coral.svg" : "assets/ghost-blue.svg";
        ghost.alt = "";
        ghost.setAttribute("aria-hidden", "true");
        cell.append(ghost);
        }
      }
      cell.setAttribute("aria-label", cell.title);
      els.matrixGrid.append(cell);
    }));
    els.matrixSize.textContent = `${boardSize} × ${boardSize}`;
    els.matrixFloor.textContent = result.floors;
    els.matrixWalls.textContent = result.walls + boundaryWalls;
    els.matrixPacmanPos.textContent = `(${result.pacmanPos.join(", ")})`;
    els.matrixGhostPos.textContent = `(${result.ghostPositions[0].join(", ")})`;
    els.matrixGhost2Pos.textContent = `(${result.ghostPositions[1].join(", ")})`;
    els.matrixDistance.textContent = `G1 ${result.distances[0]} · G2 ${result.distances[1]}`;
    els.matrixStatus.textContent = `${result.name} places \"P\" at (${result.pacmanPos.join(", ")}), \"G1\" at (${result.ghostPositions[0].join(", ")}), and \"G2\" at (${result.ghostPositions[1].join(", ")}). All ${result.floors} walkable tiles are connected. ${boundaryWalls} automatic walls create a ${boardSize} × ${boardSize} board.`;
  }

  function openLab(name) {
    const fsm = name === "fsm", matrix = name === "matrix", path = name === "path", play = name === "play", build = name === "build";
    [[els.fsmTab, els.fsmLab, fsm], [els.matrixTab, els.matrixLab, matrix], [els.pathTab, els.pathLab, path], [els.playTab, els.playLab, play], [els.buildTab, els.buildLab, build]].forEach(([tab, panel, active]) => {
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      panel.classList.toggle("active", active);
      panel.hidden = !active;
    });
    if (play) { drawGame(); renderGameHUD(); }
    if (build) renderBuilderStatus();
  }

  function moveLabFocus(event) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const tabs = [els.fsmTab, els.matrixTab, els.pathTab, els.playTab, els.buildTab];
    const current = tabs.indexOf(document.activeElement);
    let next = current;
    if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else next = (current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    tabs[next].focus();
    openLab(tabs[next].id.replace('Tab', ''));
  }

  function updateFSM() {
    const distance = Number(els.distanceSlider.value);
    let state = "PATROL";
    let reason = "The player is far away, so the monster patrols.";
    if (distance < 50) { state = "ATTACK"; reason = "The player is inside the specific attack range."; }
    else if (distance < 200) { state = "CHASE"; reason = "The player is close enough to chase but not close enough to attack."; }
    els.distanceValue.textContent = distance;
    els.distanceLine.style.setProperty("--distance-ratio", String(distance / 300));
    els.currentState.textContent = state;
    els.currentState.style.color = state === "ATTACK" ? "var(--red)" : state === "CHASE" ? "var(--violet)" : "var(--teal)";
    els.stateReason.textContent = reason;
    document.querySelectorAll(".state-card").forEach((card) => card.classList.toggle("active", card.dataset.state === state));
  }

  // Dijkstra visual lab
  const pathState = {
    mapIndex: 0, raw: [], rows: 0, cols: 0, start: null, goal: null, costs: [], distances: new Map(), previous: new Map(),
    frontier: new Set(), visited: new Set(), current: null, path: [], done: false, timer: null, editMode: false, edits: 0, editedCells: new Set(), message: ""
  };

  const posKey = (pos) => `${pos[0]},${pos[1]}`;
  const parseKey = (key) => key.split(",").map(Number);
  const same = (a, b) => a[0] === b[0] && a[1] === b[1];

  function buildMapTabs() {
    els.mapTabs.replaceChildren();
    PATH_MAPS.forEach((item, index) => {
      const button = document.createElement("button");
      button.className = `map-tab${index === pathState.mapIndex ? " active" : ""}`;
      button.textContent = item.name;
      button.addEventListener("click", () => loadMap(index));
      els.mapTabs.append(button);
    });
  }

  function loadMap(index) {
    stopAuto();
    pathState.mapIndex = index;
    pathState.raw = PATH_MAPS[index].map.map((row) => row.split(""));
    pathState.rows = pathState.raw.length;
    pathState.cols = pathState.raw[0].length;
    pathState.start = findMarker("S");
    pathState.goal = findMarker("G");
    pathState.costs = pathState.raw.map((row) => row.map((char) => char === "#" ? null : /\d/.test(char) ? Number(char) : 1));
    pathState.edits = 0;
    pathState.editedCells = new Set();
    pathState.editMode = false;
    els.editCostBtn.classList.remove("active");
    buildMapTabs();
    resetSearch();
  }

  function findMarker(marker) {
    for (let r = 0; r < pathState.rows; r += 1) {
      const c = pathState.raw[r].indexOf(marker);
      if (c >= 0) return [r, c];
    }
    return [1, 1];
  }

  function resetSearch() {
    stopAuto();
    pathState.distances = new Map();
    pathState.previous = new Map();
    pathState.frontier = new Set([posKey(pathState.start)]);
    pathState.visited = new Set();
    pathState.current = null;
    pathState.path = [];
    pathState.done = false;
    pathState.message = `${PATH_MAPS[pathState.mapIndex].description} Start has cost 0.`;
    for (let r = 0; r < pathState.rows; r += 1) for (let c = 0; c < pathState.cols; c += 1) if (pathState.costs[r][c] !== null) pathState.distances.set(posKey([r, c]), Infinity);
    pathState.distances.set(posKey(pathState.start), 0);
    renderPath();
  }

  function neighbors(pos) {
    return [[-1,0],[1,0],[0,-1],[0,1]].map(([dr,dc]) => [pos[0] + dr, pos[1] + dc]).filter(([r,c]) => r >= 0 && r < pathState.rows && c >= 0 && c < pathState.cols && pathState.costs[r][c] !== null);
  }

  function pickLowest() {
    let best = null;
    let bestCost = Infinity;
    pathState.frontier.forEach((key) => {
      const cost = pathState.distances.get(key);
      if (cost < bestCost) { best = key; bestCost = cost; }
    });
    return best;
  }

  function stepPath() {
    if (pathState.done) return;
    const picked = pickLowest();
    if (!picked) {
      pathState.done = true;
      pathState.message = "Frontier is empty. No path exists.";
      stopAuto();
      renderPath();
      return;
    }
    pathState.frontier.delete(picked);
    pathState.visited.add(picked);
    pathState.current = parseKey(picked);
    if (same(pathState.current, pathState.goal)) {
      pathState.path = tracePath();
      pathState.done = true;
      pathState.message = `Goal finalized. Lowest total cost = ${pathState.distances.get(picked)}.`;
      stopAuto();
      renderPath();
      return;
    }
    const updated = [];
    const currentCost = pathState.distances.get(picked);
    neighbors(pathState.current).forEach((next) => {
      const key = posKey(next);
      if (pathState.visited.has(key)) return;
      const nextCost = currentCost + pathState.costs[next[0]][next[1]];
      if (nextCost < pathState.distances.get(key)) {
        pathState.distances.set(key, nextCost);
        pathState.previous.set(key, picked);
        pathState.frontier.add(key);
        updated.push(`${key}→${nextCost}`);
      }
    });
    pathState.message = `Finalized ${picked} at cost ${currentCost}. ${updated.length ? `Updated ${updated.join(", ")}.` : "No better neighbor record."}`;
    renderPath();
  }

  function tracePath() {
    const result = [];
    let cursor = posKey(pathState.goal);
    while (cursor) { result.push(cursor); cursor = pathState.previous.get(cursor); }
    return result.reverse();
  }

  function direction(a, b) {
    const [ar,ac] = parseKey(a), [br,bc] = parseKey(b);
    if (br < ar) return "↑"; if (br > ar) return "↓"; if (bc < ac) return "←"; if (bc > ac) return "→"; return "";
  }

  function renderPath() {
    els.pathGrid.replaceChildren();
    els.pathGrid.style.gridTemplateColumns = `repeat(${pathState.cols}, 1fr)`;
    const pathSet = new Set(pathState.path);
    for (let r = 0; r < pathState.rows; r += 1) {
      for (let c = 0; c < pathState.cols; c += 1) {
        const pos = [r,c], key = posKey(pos), cost = pathState.costs[r][c];
        const cell = document.createElement("div");
        cell.className = "grid-cell";
        if (cost === null) cell.classList.add("wall");
        else {
          cell.textContent = cost;
          if (cost >= 3) cell.classList.add("high");
          if (pathState.frontier.has(key)) cell.classList.add("frontier");
          if (pathState.visited.has(key)) cell.classList.add("visited");
          if (pathState.current && same(pathState.current, pos)) cell.classList.add("current");
          if (pathSet.has(key)) cell.classList.add("path");
          if (pathState.editMode && !same(pos,pathState.start) && !same(pos,pathState.goal)) {
            cell.classList.add("editable");
            cell.addEventListener("click", () => editCell(pos));
          }
        }
        if (same(pos, pathState.start)) cell.append(makeToken("G", "ghost"));
        if (same(pos, pathState.goal)) cell.append(makeToken("P", "player"));
        const index = pathState.path.indexOf(key);
        if (index >= 0 && index < pathState.path.length - 1) {
          const arrow = document.createElement("span");
          arrow.className = "path-arrow";
          arrow.textContent = direction(key, pathState.path[index + 1]);
          cell.append(arrow);
        }
        els.pathGrid.append(cell);
      }
    }
    els.pathStatus.textContent = pathState.message;
    els.frontierMetric.textContent = pathState.frontier.size;
    els.visitedMetric.textContent = pathState.visited.size;
    els.costMetric.textContent = pathState.path.length ? pathState.distances.get(posKey(pathState.goal)) : "—";
    els.stepPathBtn.disabled = pathState.done;
    els.runPathBtn.textContent = pathState.timer ? "Pause" : "Run";
  }

  function makeToken(label, kind) {
    const token = document.createElement("span");
    token.className = `cell-token ${kind}`;
    const image = document.createElement("img");
    image.src = kind === "ghost" ? "assets/ghost-coral.svg" : "assets/maze-runner-open.svg";
    image.alt = label;
    token.appendChild(image);
    return token;
  }

  function editCell(pos) {
    const cycle = [1,2,3,5,9];
    const current = pathState.costs[pos[0]][pos[1]];
    pathState.costs[pos[0]][pos[1]] = cycle[(cycle.indexOf(current) + 1) % cycle.length];
    pathState.edits += 1;
    pathState.editedCells.add(posKey(pos));
    resetSearch();
    pathState.message = `${pathState.editedCells.size} different cost tile(s) edited. Run the search to observe the new route.`;
    renderPath();
  }

  function startAuto() {
    if (pathState.done) resetSearch();
    if (pathState.timer) return;
    pathState.timer = window.setInterval(stepPath, Number(els.speedSelect.value));
    renderPath();
  }

  function stopAuto() {
    if (pathState.timer) window.clearInterval(pathState.timer);
    pathState.timer = null;
    if (els.runPathBtn) els.runPathBtn.textContent = "Run";
  }

  function toggleEdit() {
    pathState.editMode = !pathState.editMode;
    els.editCostBtn.classList.toggle("active", pathState.editMode);
    pathState.message = pathState.editMode ? "Edit mode: click a floor tile to cycle 1 → 2 → 3 → 5 → 9." : "Edit mode off. Press Run to search.";
    renderPath();
  }

  // Level designer (Build lab): students paint a playable board with walls, slime, and character starts.
  const builder = { size: 12, grid: [], pacman: null, ghosts: [null, null], tool: "wall", painting: false, cells: [] };

  function defaultBuilderGrid(size) {
    return Array.from({ length: size }, () => Array(size).fill(0));
  }

  function initBuilder() {
    const saved = profile().playground;
    const validGrid = saved?.grid?.length >= 8 && saved.grid.length <= 25 && saved.grid.every((row) => Array.isArray(row) && row.length === saved.grid.length);
    if (validGrid) {
      builder.size = saved.grid.length;
      builder.grid = saved.grid.map((row) => row.map((value) => value === 1 || value === 2 ? value : 0));
      const inside = (pos) => Array.isArray(pos) && pos[0] >= 0 && pos[0] < builder.size && pos[1] >= 0 && pos[1] < builder.size ? [pos[0], pos[1]] : null;
      builder.pacman = inside(saved.pacman);
      builder.ghosts = [0, 1].map((index) => inside(saved.ghosts?.[index]));
    } else {
      builder.size = 12;
      builder.grid = defaultBuilderGrid(12);
      builder.pacman = null;
      builder.ghosts = [null, null];
    }
    els.buildSize.value = String(builder.size);
    renderBuilder();
  }

  function saveBuilder() {
    profile().playground = { size: builder.size, grid: builder.grid, pacman: builder.pacman, ghosts: builder.ghosts };
    saveStore();
  }

  function resizeBuilder(size) {
    const next = defaultBuilderGrid(size);
    const keep = Math.min(size, builder.size);
    for (let r = 0; r < keep; r += 1) for (let c = 0; c < keep; c += 1) next[r][c] = builder.grid[r][c];
    builder.size = size;
    builder.grid = next;
    const inside = (pos) => pos && pos[0] < size && pos[1] < size ? pos : null;
    builder.pacman = inside(builder.pacman);
    builder.ghosts = builder.ghosts.map(inside);
    saveBuilder();
    renderBuilder();
    updateBuildChecklist();
    syncPlaygroundOption(false);
  }

  function builderMarkerAt(row, col) {
    if (builder.pacman && builder.pacman[0] === row && builder.pacman[1] === col) return "P";
    if (builder.ghosts[0] && builder.ghosts[0][0] === row && builder.ghosts[0][1] === col) return "G1";
    if (builder.ghosts[1] && builder.ghosts[1][0] === row && builder.ghosts[1][1] === col) return "G2";
    return null;
  }

  function updateBuilderCell(row, col) {
    const cell = builder.cells[row]?.[col];
    if (!cell) return;
    const value = builder.grid[row][col];
    cell.className = `matrix-cell build-cell ${value === 1 ? "wall" : value === 2 ? "slime" : "floor"}`;
    cell.replaceChildren();
    const marker = builderMarkerAt(row, col);
    const tileName = value === 1 ? "wall" : value === 2 ? "slime (ghosts cross at half speed)" : "pellet path";
    cell.title = marker ? `row ${row}, column ${col}: ${marker === "P" ? "Pac-Man start" : marker + " start"}` : `row ${row}, column ${col}: ${tileName}`;
    if (marker) {
      cell.classList.add(marker === "P" ? "runner" : "ghost");
      const image = document.createElement("img");
      image.src = marker === "P" ? "assets/maze-runner-open.svg" : marker === "G1" ? "assets/ghost-coral.svg" : "assets/ghost-blue.svg";
      image.alt = "";
      image.draggable = false;
      cell.append(image);
    }
  }

  function renderBuilder() {
    els.buildGrid.replaceChildren();
    els.buildGrid.style.gridTemplateColumns = `repeat(${builder.size}, minmax(0, 1fr))`;
    builder.cells = [];
    for (let r = 0; r < builder.size; r += 1) {
      builder.cells.push([]);
      for (let c = 0; c < builder.size; c += 1) {
        const cell = document.createElement("div");
        cell.dataset.row = String(r);
        cell.dataset.col = String(c);
        builder.cells[r].push(cell);
        els.buildGrid.append(cell);
        updateBuilderCell(r, c);
      }
    }
    els.buildSizeValue.textContent = `${builder.size} × ${builder.size}`;
    renderBuilderStatus();
  }

  function applyBuilderTool(row, col) {
    const refresh = [[row, col]];
    if (builder.tool === "wall" || builder.tool === "floor" || builder.tool === "slime") {
      builder.grid[row][col] = builder.tool === "wall" ? 1 : builder.tool === "slime" ? 2 : 0;
      if (builder.tool === "wall") {
        if (builderMarkerAt(row, col) === "P") builder.pacman = null;
        builder.ghosts = builder.ghosts.map((pos) => pos && pos[0] === row && pos[1] === col ? null : pos);
      }
    } else {
      if (builder.grid[row][col] === 1) builder.grid[row][col] = 0;
      const previous = builder.tool === "pacman" ? builder.pacman : builder.ghosts[builder.tool === "g1" ? 0 : 1];
      if (previous) refresh.push(previous);
      // A tile holds one character: placing over another marker moves that marker away.
      if (builder.tool !== "pacman" && builderMarkerAt(row, col) === "P") builder.pacman = null;
      builder.ghosts = builder.ghosts.map((pos, index) => {
        const isTarget = (builder.tool === "g1" && index === 0) || (builder.tool === "g2" && index === 1);
        return !isTarget && pos && pos[0] === row && pos[1] === col ? null : pos;
      });
      if (builder.tool === "pacman") builder.pacman = [row, col];
      if (builder.tool === "g1") builder.ghosts[0] = [row, col];
      if (builder.tool === "g2") builder.ghosts[1] = [row, col];
    }
    refresh.forEach(([r, c]) => updateBuilderCell(r, c));
    renderBuilderStatus();
  }

  function builderCounts() {
    let walls = 0, slime = 0;
    builder.grid.forEach((row) => row.forEach((value) => {
      if (value === 1) walls += 1;
      if (value === 2) slime += 1;
    }));
    return { walls, slime };
  }

  function builderReachable() {
    if (!builder.pacman) return new Set();
    const reachable = new Set([builder.pacman.join(",")]);
    const queue = [builder.pacman];
    while (queue.length) {
      const [row, col] = queue.shift();
      [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dr, dc]) => {
        const nr = row + dr, nc = col + dc, key = `${nr},${nc}`;
        if (nr < 0 || nr >= builder.size || nc < 0 || nc >= builder.size || builder.grid[nr][nc] === 1 || reachable.has(key)) return;
        reachable.add(key);
        queue.push([nr, nc]);
      });
    }
    return reachable;
  }

  function playgroundStatus() {
    const { walls, slime } = builderCounts();
    const checks = [];
    const issues = [];
    const check = (ok, doneLabel, issueLabel) => {
      checks.push([ok, doneLabel]);
      if (!ok) issues.push(issueLabel);
    };
    check(walls >= 12, `Paint at least 12 wall tiles (${Math.min(walls, 12)}/12)`, `Paint at least 12 wall tiles. Current: ${walls}.`);
    check(slime >= 3, `Paint at least 3 slime tiles (${Math.min(slime, 3)}/3)`, `Paint at least 3 slime tiles. Current: ${slime}.`);
    check(Boolean(builder.pacman), "Place Pac-Man (P)", "Place Pac-Man with the P tool.");
    check(Boolean(builder.ghosts[0]), "Place Ghost 1 (G1)", "Place Ghost 1 with the G1 tool.");
    check(Boolean(builder.ghosts[1]), "Place Ghost 2 (G2)", "Place Ghost 2 with the G2 tool.");
    if (builder.pacman) {
      const reachable = builderReachable();
      builder.ghosts.forEach((pos, index) => {
        if (!pos) return;
        const connected = reachable.has(pos.join(","));
        const distance = Math.abs(pos[0] - builder.pacman[0]) + Math.abs(pos[1] - builder.pacman[1]);
        check(connected, `Ghost ${index + 1} can reach Pac-Man`, `Ghost ${index + 1} is sealed off — connect its corridor to Pac-Man.`);
        check(distance >= 6, `Ghost ${index + 1} starts ≥ 6 tiles away`, `Move Ghost ${index + 1} at least 6 tiles from Pac-Man. Current distance: ${distance}.`);
      });
    }
    check(Boolean(profile().playgroundPlayed), "Play your map once", "Press Play this map, then START GAME.");
    return { ok: !issues.length, checks, issues };
  }

  function renderBuilderStatus(message) {
    if (message) {
      els.buildStatus.textContent = message;
      return;
    }
    const { walls, slime } = builderCounts();
    const markers = [builder.pacman ? "P ✓" : "P —", builder.ghosts[0] ? "G1 ✓" : "G1 —", builder.ghosts[1] ? "G2 ✓" : "G2 —"].join(" · ");
    els.buildStatus.textContent = `${builder.size} × ${builder.size} board · ${walls} walls · ${slime} slime · ${markers}. Border walls, pellets, and random power coins are added at play time.`;
  }

  function playgroundGameRows() {
    if (!builder.grid.length || !builder.pacman || !builder.ghosts[0] || !builder.ghosts[1]) return null;
    const border = "#".repeat(builder.size + 2);
    const rows = builder.grid.map((row, r) => `#${row.map((value, c) => {
      const marker = builderMarkerAt(r, c);
      if (marker === "P") return "P";
      if (marker === "G1") return "A";
      if (marker === "G2") return "B";
      return value === 1 ? "#" : value === 2 ? "~" : ".";
    }).join("")}#`);
    return [border, ...rows, border];
  }

  function syncPlaygroundOption(selectPlayground = false) {
    const rows = playgroundGameRows();
    els.playgroundMapOption.disabled = !rows;
    els.playgroundMapOption.textContent = rows ? `Playground · ${builder.size} × ${builder.size}` : "Playground · design first";
    if (rows && selectPlayground) {
      game.mapIndex = 3;
      profile().gameMapIndex = 3;
      els.gameMapSelect.value = "3";
    } else if (!rows && game.mapIndex === 3) {
      game.mapIndex = 0;
      profile().gameMapIndex = 0;
      els.gameMapSelect.value = "0";
    }
    return rows;
  }

  function playBuilderMap() {
    saveBuilder();
    if (!builder.pacman || !builder.ghosts[0] || !builder.ghosts[1]) {
      renderBuilderStatus("Place P, G1, and G2 before playing your level.");
      return;
    }
    // A level where a ghost and Pac-Man can never meet is unplayable — refuse to start it.
    const reachable = builderReachable();
    const sealed = builder.ghosts
      .map((pos, index) => pos && !reachable.has(pos.join(",")) ? `G${index + 1}` : null)
      .filter(Boolean);
    if (sealed.length) {
      renderBuilderStatus(`${sealed.join(" and ")} cannot reach Pac-Man — open a corridor between them before playing.`);
      return;
    }
    const rows = syncPlaygroundOption(true);
    if (!rows) {
      renderBuilderStatus("Place P, G1, and G2 before playing your level.");
      return;
    }
    saveStore();
    resetGame(false);
    openLab("play");
    setGameOverlay("YOUR LEVEL", "Press START GAME to play the maze you designed", "START GAME", true);
    showToast("Playground map loaded");
    updateBuildChecklist();
  }

  function builderCellFromEvent(event) {
    const target = document.elementFromPoint(event.clientX, event.clientY);
    const cell = target?.closest?.(".build-cell");
    if (!cell) return null;
    return [Number(cell.dataset.row), Number(cell.dataset.col)];
  }

  // Playable Pac-Man lab. Completed coding missions progressively upgrade the ghost AI.
  // "~" is sticky slime: still walkable and holds a pellet, but ghosts cross it at half speed (cost 2).
  const GAME_MAPS = [
    [
      "#################", "#P....#.........#", "#.###.#.#####.#.#", "#.....#...#...#.#", "###.#####.#.###.#",
      "#...#..~~.#.....#", "#.#.#.###.#####.#", "#.#.....#.......#", "#.#####.#.#####.#", "#...~~..#.....#.#",
      "#.###.#####.#.#.#", "#...#..~~...#...#", "#.#.###.#.###.#.#", "#G......#......G#", "#################"
    ],
    [
      "#################", "#P......#.......#", "#.#####.#.#####.#", "#.....#.#.#.....#", "#####.#.#.#.#####",
      "#..~~.#...#.....#", "#.###.#####.###.#", "#...#...#...#...#", "###.###.#.###.###", "#.....#...#.~~..#",
      "#.###.#####.###.#", "#.#..~~.#.....#.#", "#.#.###.#.###.#.#", "#G....#...#....G#", "#################"
    ]
  ];

  function studentGameMapData() {
    const result = parseMatrixCode(profile().studentMapCode || "");
    if (!result.ok) return null;
    const boundary = "#".repeat(result.size + 2);
    const rows = result.matrix.map((row) => `#${row.map((value) => {
      if (value === 1) return "#";
      if (value === 0) return ".";
      if (value === "P") return "P";
      return value === "G1" ? "A" : "B";
    }).join("")}#`);
    return { result, rows: [boundary, ...rows, boundary] };
  }

  function syncStudentMapOption(selectStudent = false) {
    const studentMap = studentGameMapData();
    els.studentMapOption.disabled = !studentMap;
    els.studentMapOption.textContent = studentMap ? `Student map · ${studentMap.result.size} × ${studentMap.result.size}` : "Student map · build first";
    if (studentMap && selectStudent) {
      game.mapIndex = 2;
      profile().gameMapIndex = 2;
      els.gameMapSelect.value = "2";
    } else if (!studentMap && game.mapIndex === 2) {
      game.mapIndex = 0;
      profile().gameMapIndex = 0;
      els.gameMapSelect.value = "0";
    }
    return studentMap;
  }

  const DIRS = { UP: { x: 0, y: -1 }, DOWN: { x: 0, y: 1 }, LEFT: { x: -1, y: 0 }, RIGHT: { x: 1, y: 0 }, NONE: { x: 0, y: 0 } };
  const game = {
    mapIndex: 0, map: [], playerStart: null, ghostStarts: [], player: null, ghosts: [], pellets: new Set(), coins: new Set(), powerTimer: 0, score: 0, lives: 3,
    running: false, paused: false, sound: true, lastTime: 0, tick: 0, audio: null, lastStateSound: 0, message: "READY?"
  };
  const gameCtx = els.gameCanvas.getContext("2d");
  const spriteSources = {
    runnerOpen: "assets/maze-runner-open.svg",
    runnerClosed: "assets/maze-runner-closed.svg",
    ghostCoral: "assets/ghost-coral.svg",
    ghostBlue: "assets/ghost-blue.svg"
  };
  const sprites = Object.fromEntries(Object.entries(spriteSources).map(([key, source]) => {
    const image = new Image();
    image.src = source;
    return [key, image];
  }));

  function completedSet() {
    const skipped = new Set(profile().skipped || []);
    return new Set(profile().completed.filter((id) => !skipped.has(id)));
  }

  function fullStudentAIReady() {
    // Mission 12 (playground) is a bonus level-design activity and not part of the AI build.
    const complete = completedSet();
    return COURSE_MISSIONS.every((item) => item.id === "playground" || complete.has(item.id));
  }

  function findGameMarkers() {
    game.playerStart = null;
    const genericGhosts = [], namedGhosts = [];
    game.map.forEach((row, r) => row.forEach((char, c) => {
      if (char === "P") game.playerStart = [r, c];
      if (char === "G") genericGhosts.push([r, c]);
      if (char === "A") namedGhosts[0] = [r, c];
      if (char === "B") namedGhosts[1] = [r, c];
    }));
    game.ghostStarts = namedGhosts.filter(Boolean).length ? namedGhosts.filter(Boolean) : genericGhosts;
  }

  function makeEntity(start, kind, index = 0) {
    return {
      x: start[1] + .5, y: start[0] + .5, start: [...start], dir: { ...DIRS.NONE }, desired: { ...DIRS.NONE },
      kind, index, state: "PATROL", lastDecision: "", cachedPath: [], debugPath: [], color: index === 0 ? "#ff6f7d" : "#65bcff",
      action: "patrol()", distance: Infinity, pathCost: null, replans: 0, lastCenter: "", frightImmune: false
    };
  }

  function resetGame(keepScore = false) {
    const studentMap = game.mapIndex === 2 ? studentGameMapData() : null;
    const playgroundRows = game.mapIndex === 3 ? playgroundGameRows() : null;
    if ((game.mapIndex === 2 && !studentMap) || (game.mapIndex === 3 && !playgroundRows)) {
      game.mapIndex = 0;
      els.gameMapSelect.value = "0";
    }
    const selectedRows = studentMap?.rows || playgroundRows || GAME_MAPS[game.mapIndex] || GAME_MAPS[0];
    game.map = selectedRows.map((row) => row.split(""));
    findGameMarkers();
    game.player = makeEntity(game.playerStart, "player");
    game.ghosts = game.ghostStarts.map((start, index) => makeEntity(start, "ghost", index));
    game.pellets = new Set();
    game.coins = new Set();
    game.map.forEach((row, r) => row.forEach((char, c) => {
      if (char === "." || char === "~") game.pellets.add(`${r},${c}`);
      if (char === "o") game.coins.add(`${r},${c}`);
    }));
    // Pellets and coins spawn only where Pac-Man can actually reach, so a sealed-off
    // pocket can never make the maze impossible to clear.
    if (game.playerStart) {
      const reachable = new Set([`${game.playerStart[0]},${game.playerStart[1]}`]);
      const queue = [game.playerStart];
      while (queue.length) {
        const [row, col] = queue.shift();
        [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dr, dc]) => {
          const nr = row + dr, nc = col + dc, key = `${nr},${nc}`;
          if (isGameWall(nr, nc) || reachable.has(key)) return;
          reachable.add(key);
          queue.push([nr, nc]);
        });
      }
      game.pellets = new Set([...game.pellets].filter((key) => reachable.has(key)));
      game.coins = new Set([...game.coins].filter((key) => reachable.has(key)));
    }
    // Classic power pellets: each round, a few random pellets (away from Pac-Man's
    // start) become power coins. Eating one lets Pac-Man hunt the ghosts.
    if (game.playerStart) {
      const pool = [...game.pellets].filter((key) => {
        const [row, col] = key.split(",").map(Number);
        return Math.abs(row - game.playerStart[0]) + Math.abs(col - game.playerStart[1]) >= 4;
      });
      const powerCount = Math.min(pool.length >= 70 ? 4 : 3, pool.length);
      for (let i = 0; i < powerCount; i += 1) {
        const pick = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
        game.pellets.delete(pick);
        game.coins.add(pick);
      }
    }
    game.powerTimer = 0;
    if (!keepScore) { game.score = 0; game.lives = 3; }
    game.running = false;
    game.paused = false;
    game.message = "READY?";
    const connected = game.ghostStarts.every((ghostStart) => findGamePath(game.playerStart, ghostStart, false).length > 0);
    els.gameCanvas.dataset.selfcheck = connected ? "pass" : "fail";
    els.gamePlayBtn.textContent = "Play";
    els.gamePauseBtn.textContent = "Pause";
    setGameOverlay("READY?", "Arrow keys or W A S D", "START GAME", true);
    renderGameHUD();
    drawGame();
  }

  function resetEntityPositions() {
    game.player = makeEntity(game.playerStart, "player");
    game.ghosts = game.ghostStarts.map((start, index) => makeEntity(start, "ghost", index));
  }

  function setGameOverlay(title, subtitle, button, show) {
    els.gameOverlay.querySelector("strong").textContent = title;
    els.gameOverlay.querySelector("span").textContent = subtitle;
    $("overlayPlayBtn").textContent = button;
    els.gameOverlay.classList.toggle("show", show);
  }

  function startGame() {
    if (game.lives <= 0 || game.pellets.size === 0) resetGame(false);
    if (game.mapIndex === 3 && !profile().playgroundPlayed) {
      profile().playgroundPlayed = true;
      saveStore();
      updateBuildChecklist();
    }
    game.running = true;
    game.paused = false;
    game.lastTime = performance.now();
    els.gameOverlay.classList.remove("show");
    els.gamePlayBtn.textContent = "Playing";
    els.gamePauseBtn.textContent = "Pause";
    playCue("start");
  }

  function toggleGamePause() {
    if (!game.running) return;
    game.paused = !game.paused;
    els.gamePauseBtn.textContent = game.paused ? "Resume" : "Pause";
    setGameOverlay(game.paused ? "PAUSED" : "", game.paused ? "Your code and game state are safe." : "", "RESUME", game.paused);
    playCue(game.paused ? "pause" : "resume");
  }

  function isGameWall(row, col) {
    return row < 0 || row >= game.map.length || col < 0 || col >= game.map[0].length || game.map[row][col] === "#";
  }

  function canMove(row, col, dir) {
    return !isGameWall(row + dir.y, col + dir.x);
  }

  function atCenter(entity) {
    const col = Math.floor(entity.x), row = Math.floor(entity.y);
    return Math.abs(entity.x - (col + .5)) < .09 && Math.abs(entity.y - (row + .5)) < .09;
  }

  function snapCenter(entity) {
    const col = Math.floor(entity.x), row = Math.floor(entity.y);
    entity.x = col + .5;
    entity.y = row + .5;
    return [row, col];
  }

  function movePlayer(dt) {
    const player = game.player;
    const currentRow = Math.floor(player.y), currentCol = Math.floor(player.x);
    const currentKey = `${currentRow},${currentCol}`;
    const reachedNewCenter = atCenter(player) && player.lastCenter !== currentKey;
    const waitingAtCenter = atCenter(player) && player.dir.x === 0 && player.dir.y === 0;
    if (reachedNewCenter || waitingAtCenter) {
      const [row, col] = snapCenter(player);
      player.lastCenter = `${row},${col}`;
      if ((player.desired.x || player.desired.y) && canMove(row, col, player.desired)) player.dir = { ...player.desired };
      if (!canMove(row, col, player.dir)) player.dir = { ...DIRS.NONE };
    }
    player.x += player.dir.x * 3.25 * dt;
    player.y += player.dir.y * 3.25 * dt;
    collectPellet();
  }

  function collectPellet() {
    const row = Math.floor(game.player.y), col = Math.floor(game.player.x), key = `${row},${col}`;
    const centered = Math.abs(game.player.x - (col + .5)) < .28 && Math.abs(game.player.y - (row + .5)) < .28;
    if (!centered) return;
    let collected = false;
    if (game.pellets.delete(key)) {
      game.score += 10;
      playCue(game.score % 20 ? "pelletLow" : "pelletHigh");
      collected = true;
    }
    if (game.coins.delete(key)) {
      game.score += 50;
      game.powerTimer = 7;
      game.ghosts.forEach((ghost) => { ghost.frightImmune = false; ghost.cachedPath = []; });
      playCue("power");
      collected = true;
    }
    if (!collected) return;
    if (game.pellets.size === 0 && game.coins.size === 0) {
      game.running = false;
      setGameOverlay("MAZE CLEARED", `Score ${game.score} · Smart AI survived`, "PLAY AGAIN", true);
      playCue("clear");
    }
  }

  function ghostState(ghost) {
    const complete = completedSet();
    const ghostRow = Math.floor(ghost.y), ghostCol = Math.floor(ghost.x);
    const playerRow = Math.floor(game.player.y), playerCol = Math.floor(game.player.x);
    // 12 units per tile: with the default ranges CHASE engages within ~16 tiles
    // (most of the maze) and ATTACK within ~4 tiles, so ghosts visibly hunt.
    const distance = (Math.abs(ghostRow - playerRow) + Math.abs(ghostCol - playerCol)) * 12;
    ghost.distance = distance;
    if (!complete.has("conditions") || !complete.has("distance")) return "PATROL";
    // Mission 11 lets students tune these constants; defaults match the lecture.
    const ranges = profile().fsmRanges || {};
    const attackRange = Number(ranges.attack) > 0 ? Number(ranges.attack) : 50;
    const chaseRange = Number(ranges.chase) > attackRange ? Number(ranges.chase) : Math.max(200, attackRange + 1);
    if (distance < attackRange) return "ATTACK";
    if (distance < chaseRange) return "CHASE";
    return "PATROL";
  }

  function legalDirections(row, col, reverse) {
    const all = Object.entries(DIRS).filter(([name]) => name !== "NONE").map(([name, dir]) => ({ name, dir }));
    const legal = all.filter(({ dir }) => canMove(row, col, dir));
    const withoutReverse = legal.filter(({ dir }) => !(dir.x === reverse.x && dir.y === reverse.y));
    return withoutReverse.length ? withoutReverse : legal;
  }

  function choosePatrolDirection(ghost, legal, row, col) {
    if (ghost.dir.x === 0 && ghost.dir.y === 0) {
      return { ...legal[(row + col + ghost.index) % legal.length].dir };
    }
    const preferLeft = (Math.floor(game.tick / 6) + ghost.index) % 2 === 0;
    const turnRank = ({ dir }) => {
      const cross = ghost.dir.x * dir.y - ghost.dir.y * dir.x;
      const straight = dir.x === ghost.dir.x && dir.y === ghost.dir.y;
      if (straight) return 1;
      if ((preferLeft && cross < 0) || (!preferLeft && cross > 0)) return 0;
      return 2;
    };
    return { ...legal.slice().sort((a, b) => turnRank(a) - turnRank(b))[0].dir };
  }

  function gamePathCost(path, weighted) {
    return path.slice(1).reduce((total, key) => {
      const [row, col] = key.split(",").map(Number);
      return total + gameTileCost(row, col, weighted);
    }, 0);
  }

  function chooseGhostDirection(ghost, row, col) {
    const complete = completedSet();
    const nextState = ghostState(ghost);
    if (nextState !== ghost.state) {
      ghost.cachedPath = [];
      const now = performance.now();
      if (game.running && now - game.lastStateSound > 240) {
        playCue(nextState.toLowerCase());
        game.lastStateSound = now;
      }
    }
    ghost.state = nextState;
    const reverse = { x: -ghost.dir.x, y: -ghost.dir.y };
    const legal = legalDirections(row, col, reverse);
    if (!legal.length) return { ...DIRS.NONE };

    // Power mode: frightened ghosts drop their plans and flee from Pac-Man.
    if (game.powerTimer > 0 && !ghost.frightImmune) {
      ghost.state = "FRIGHTENED";
      ghost.action = "flee() · power coin active";
      ghost.cachedPath = [];
      ghost.debugPath = [];
      ghost.pathCost = null;
      const away = [Math.floor(game.player.y), Math.floor(game.player.x)];
      legal.sort((a, b) => {
        const da = Math.abs(row + a.dir.y - away[0]) + Math.abs(col + a.dir.x - away[1]);
        const db = Math.abs(row + b.dir.y - away[0]) + Math.abs(col + b.dir.x - away[1]);
        return db - da;
      });
      return { ...legal[0].dir };
    }

    if (ghost.state === "PATROL") {
      ghost.action = "patrol() · junction turns";
      ghost.debugPath = [];
      ghost.pathCost = null;
      return choosePatrolDirection(ghost, legal, row, col);
    }

    const target = [Math.floor(game.player.y), Math.floor(game.player.x)];
    const weighted = complete.has("cost");
    const canFollowStudentPath = ghost.state === "CHASE" && complete.has("grid") && complete.has("dijkstra") && complete.has("path-api");
    if (canFollowStudentPath) {
      const shouldRecalculate = complete.has("recalculate") || ghost.cachedPath.length < 2;
      if (shouldRecalculate) {
        ghost.cachedPath = findGamePath([row, col], target, weighted, ghost.index);
        ghost.replans += 1;
      }
      else {
        const currentIndex = ghost.cachedPath.indexOf(`${row},${col}`);
        if (currentIndex >= 0) ghost.cachedPath = ghost.cachedPath.slice(currentIndex);
      }
      ghost.debugPath = [...ghost.cachedPath];
      ghost.pathCost = gamePathCost(ghost.cachedPath, weighted);
      ghost.action = complete.has("recalculate") ? "find_path() → path[1] · recalculated" : "find_path() → path[1]";
      const nextKey = ghost.cachedPath.length > 1 ? ghost.cachedPath[1] : null;
      if (nextKey) {
        const [nr, nc] = nextKey.split(",").map(Number);
        return { x: Math.sign(nc - col), y: Math.sign(nr - row) };
      }
    }

    ghost.debugPath = [];
    ghost.pathCost = null;
    ghost.action = ghost.state === "ATTACK" ? "attack() · direct pressure" : "chase_player() · greedy fallback";

    legal.sort((a, b) => {
      const da = Math.abs(row + a.dir.y - target[0]) + Math.abs(col + a.dir.x - target[1]);
      const db = Math.abs(row + b.dir.y - target[0]) + Math.abs(col + b.dir.x - target[1]);
      return da - db;
    });
    return { ...legal[0].dir };
  }

  function moveGhost(ghost, dt) {
    const currentRow = Math.floor(ghost.y), currentCol = Math.floor(ghost.x);
    const currentKey = `${currentRow},${currentCol}`;
    const reachedNewCenter = atCenter(ghost) && ghost.lastDecision !== currentKey;
    const waitingAtCenter = atCenter(ghost) && ghost.dir.x === 0 && ghost.dir.y === 0;
    if (reachedNewCenter || waitingAtCenter) {
      const [row, col] = snapCenter(ghost);
      const key = `${row},${col}`;
      ghost.dir = chooseGhostDirection(ghost, row, col);
      ghost.lastDecision = key;
      game.tick += 1;
      if (!canMove(row, col, ghost.dir)) ghost.dir = chooseGhostDirection(ghost, row, col);
    }
    const complete = completedSet();
    // Player moves at 3.25; a hunting ghost stays close (CHASE/ATTACK) but never faster,
    // so the maze stays winnable. PATROL wanders slowly.
    const base = ghost.state === "ATTACK" ? 2.8 : ghost.state === "CHASE" ? 2.55 : 1.8;
    // Sticky slime always halves ghost speed (cost 2 = two ticks per tile); Pac-Man hops across freely.
    const terrain = isGameSlime(Math.floor(ghost.y), Math.floor(ghost.x)) ? .5 : 1;
    const fright = ghost.state === "FRIGHTENED" && game.powerTimer > 0 ? .62 : 1;
    const speed = (base + (complete.has("integration") ? .22 : 0)) * terrain * fright;
    ghost.x += ghost.dir.x * speed * dt;
    ghost.y += ghost.dir.y * speed * dt;
  }

  function isGameSlime(row, col) {
    return game.map[row]?.[col] === "~";
  }

  function gameTileCost(row, col, weighted) {
    if (!weighted) return 1;
    return isGameSlime(row, col) ? 2 : 1;
  }

  function findGamePath(start, goal, weighted, tieOffset = 0) {
    const startKey = `${start[0]},${start[1]}`, goalKey = `${goal[0]},${goal[1]}`;
    const frontier = new Set([startKey]), distance = new Map([[startKey, 0]]), previous = new Map(), visited = new Set();
    while (frontier.size) {
      let current = null, best = Infinity;
      frontier.forEach((key) => { const value = distance.get(key); if (value < best) { best = value; current = key; } });
      if (!current) break;
      frontier.delete(current);
      if (current === goalKey) break;
      visited.add(current);
      const [row, col] = current.split(",").map(Number);
      const directions = [[-1,0],[1,0],[0,-1],[0,1]];
      directions.map((_, index) => directions[(index + tieOffset) % directions.length]).forEach(([dr,dc]) => {
        const nr = row + dr, nc = col + dc, key = `${nr},${nc}`;
        if (isGameWall(nr, nc) || visited.has(key)) return;
        const nextCost = best + gameTileCost(nr, nc, weighted);
        if (nextCost < (distance.get(key) ?? Infinity)) { distance.set(key, nextCost); previous.set(key, current); frontier.add(key); }
      });
    }
    if (startKey !== goalKey && !previous.has(goalKey)) return [];
    const result = [];
    let cursor = goalKey;
    while (cursor) { result.push(cursor); if (cursor === startKey) break; cursor = previous.get(cursor); }
    return result.reverse();
  }

  function checkGameCollision() {
    let lifeLost = false;
    game.ghosts.forEach((ghost) => {
      if (Math.hypot(ghost.x - game.player.x, ghost.y - game.player.y) >= .55) return;
      if (game.powerTimer > 0 && !ghost.frightImmune) {
        // Power mode: Pac-Man eats the ghost, which respawns at its start tile.
        game.score += 200;
        Object.assign(ghost, makeEntity(ghost.start, "ghost", ghost.index));
        ghost.frightImmune = true;
        playCue("ghostEaten");
        return;
      }
      lifeLost = true;
    });
    if (!lifeLost) return;
    game.powerTimer = 0;
    game.lives -= 1;
    game.running = false;
    playCue(game.lives <= 0 ? "gameOver" : "lifeLost");
    if (game.lives <= 0) setGameOverlay("GAME OVER", `Final score ${game.score}`, "RESTART", true);
    else {
      resetEntityPositions();
      setGameOverlay("LIFE LOST", `${game.lives} lives remaining`, "CONTINUE", true);
    }
    els.gamePlayBtn.textContent = "Play";
    renderGameHUD();
  }

  function updateGame(dt) {
    movePlayer(dt);
    game.ghosts.forEach((ghost) => moveGhost(ghost, dt));
    if (game.powerTimer > 0) {
      game.powerTimer = Math.max(0, game.powerTimer - dt);
      if (game.powerTimer === 0) game.ghosts.forEach((ghost) => { ghost.frightImmune = false; ghost.cachedPath = []; });
    }
    checkGameCollision();
    renderGameHUD();
  }

  function drawGame() {
    if (!game.map.length) return;
    const width = els.gameCanvas.width, height = els.gameCanvas.height;
    const cellW = width / game.map[0].length, cellH = height / game.map.length;
    gameCtx.clearRect(0, 0, width, height);
    gameCtx.fillStyle = "#03090c";
    gameCtx.fillRect(0, 0, width, height);

    game.map.forEach((row, r) => row.forEach((char, c) => {
      if (char === "#") {
        const pad = 2.5;
        gameCtx.fillStyle = "#183841";
        gameCtx.strokeStyle = "#3d8490";
        gameCtx.lineWidth = 1.6;
        gameCtx.beginPath();
        gameCtx.roundRect(c * cellW + pad, r * cellH + pad, cellW - pad * 2, cellH - pad * 2, 5);
        gameCtx.fill(); gameCtx.stroke();
      } else if (char === "~") {
        const pad = 1.5;
        gameCtx.fillStyle = "rgba(53, 178, 126, .30)";
        gameCtx.strokeStyle = "rgba(95, 244, 200, .45)";
        gameCtx.lineWidth = 1.2;
        gameCtx.beginPath();
        gameCtx.roundRect(c * cellW + pad, r * cellH + pad, cellW - pad * 2, cellH - pad * 2, 7);
        gameCtx.fill(); gameCtx.stroke();
        gameCtx.fillStyle = "rgba(95, 244, 200, .5)";
        [[.28, .32, .10], [.68, .62, .08], [.45, .78, .06]].forEach(([bx, by, br]) => {
          gameCtx.beginPath();
          gameCtx.arc((c + bx) * cellW, (r + by) * cellH, Math.max(1.5, cellW * br), 0, Math.PI * 2);
          gameCtx.fill();
        });
      }
    }));

    game.pellets.forEach((key) => {
      const [r,c] = key.split(",").map(Number);
      gameCtx.fillStyle = "#d7ede8";
      gameCtx.beginPath(); gameCtx.arc((c + .5) * cellW, (r + .5) * cellH, Math.max(2, cellW * .07), 0, Math.PI * 2); gameCtx.fill();
    });

    game.coins.forEach((key) => {
      const [r,c] = key.split(",").map(Number);
      const pulse = 1 + Math.sin(performance.now() / 260 + r + c) * .12;
      const radius = Math.max(4, cellW * .17) * pulse;
      gameCtx.fillStyle = "#ffd34d";
      gameCtx.strokeStyle = "#b98d00";
      gameCtx.lineWidth = 1.5;
      gameCtx.beginPath(); gameCtx.arc((c + .5) * cellW, (r + .5) * cellH, radius, 0, Math.PI * 2); gameCtx.fill(); gameCtx.stroke();
      gameCtx.fillStyle = "rgba(255, 255, 255, .55)";
      gameCtx.beginPath(); gameCtx.arc((c + .42) * cellW, (r + .42) * cellH, radius * .3, 0, Math.PI * 2); gameCtx.fill();
    });

    let chasePathLines = 0;
    if (completedSet().has("dijkstra")) {
      const pathColors = ["rgba(255,111,125,.58)", "rgba(101,188,255,.68)"];
      game.ghosts.forEach((ghost, ghostIndex) => {
        if (ghost.state !== "CHASE" || ghost.debugPath.length < 2) return;
        chasePathLines += 1;
        gameCtx.save();
        gameCtx.strokeStyle = pathColors[ghostIndex] || "rgba(95,244,200,.55)";
        gameCtx.lineWidth = 3;
        gameCtx.lineCap = "round";
        gameCtx.lineJoin = "round";
        gameCtx.setLineDash(ghostIndex === 1 ? [7, 5] : []);
        gameCtx.beginPath();
        gameCtx.moveTo(ghost.x * cellW, ghost.y * cellH);
        ghost.debugPath.slice(1).forEach((key) => {
          const [row, column] = key.split(",").map(Number);
          gameCtx.lineTo((column + .5) * cellW, (row + .5) * cellH);
        });
        gameCtx.stroke();
        gameCtx.restore();
      });
    }
    els.gameCanvas.dataset.pathLines = String(chasePathLines);

    drawPlayer(game.player.x * cellW, game.player.y * cellH, Math.min(cellW,cellH) * .34);
    game.ghosts.forEach((ghost) => drawGhost(ghost, ghost.x * cellW, ghost.y * cellH, Math.min(cellW,cellH) * .34));
  }

  function drawPlayer(x, y, radius) {
    const orientation = game.player.dir.x < 0 ? Math.PI : game.player.dir.y < 0 ? -Math.PI/2 : game.player.dir.y > 0 ? Math.PI/2 : 0;
    const sprite = Math.sin(performance.now() / 85) > -.15 ? sprites.runnerOpen : sprites.runnerClosed;
    if (sprite.complete && sprite.naturalWidth) {
      const size = radius * 2.45;
      gameCtx.save();
      gameCtx.translate(x, y);
      gameCtx.rotate(orientation);
      gameCtx.drawImage(sprite, -size / 2, -size / 2, size, size);
      gameCtx.restore();
      return;
    }
    const angle = .28;
    gameCtx.fillStyle = "#ffd34d";
    gameCtx.beginPath(); gameCtx.moveTo(x,y); gameCtx.arc(x,y,radius,orientation+angle,orientation+Math.PI*2-angle); gameCtx.closePath(); gameCtx.fill();
  }

  function drawGhost(ghost, x, y, radius) {
    const frightened = ghost.state === "FRIGHTENED" && game.powerTimer > 0 && !ghost.frightImmune;
    const sprite = ghost.index === 0 ? sprites.ghostCoral : sprites.ghostBlue;
    if (!frightened && sprite.complete && sprite.naturalWidth) {
      const size = radius * 2.55;
      const bob = Math.sin(performance.now() / 170 + ghost.index) * radius * .055;
      gameCtx.drawImage(sprite, x - size / 2, y - size / 2 + bob, size, size);
      return;
    }
    // Frightened ghosts flash white when the power coin is about to run out.
    const flashing = frightened && game.powerTimer < 2 && Math.floor(performance.now() / 180) % 2 === 0;
    gameCtx.fillStyle = frightened ? (flashing ? "#e8ecff" : "#3646c8") : ghost.color;
    gameCtx.beginPath(); gameCtx.arc(x,y-radius*.15,radius,Math.PI,0); gameCtx.lineTo(x+radius,y+radius);
    gameCtx.lineTo(x+radius*.5,y+radius*.65); gameCtx.lineTo(x,y+radius); gameCtx.lineTo(x-radius*.5,y+radius*.65); gameCtx.lineTo(x-radius,y+radius); gameCtx.closePath(); gameCtx.fill();
    const eyeX = ghost.dir.x * radius * .12, eyeY = ghost.dir.y * radius * .12;
    [-.35,.35].forEach((offset) => { gameCtx.fillStyle="#fff";gameCtx.beginPath();gameCtx.arc(x+offset*radius,y-radius*.2,radius*.22,0,Math.PI*2);gameCtx.fill();gameCtx.fillStyle="#10202a";gameCtx.beginPath();gameCtx.arc(x+offset*radius+eyeX,y-radius*.2+eyeY,radius*.1,0,Math.PI*2);gameCtx.fill(); });
  }

  function renderGameHUD() {
    if (!els.gameScore) return;
    const complete = completedSet();
    const ready = fullStudentAIReady();
    els.gameScore.textContent = game.score;
    els.gameLives.textContent = Array.from({ length: Math.max(0, game.lives) }, () => "●").join(" ") || "—";
    els.aiBuild.textContent = `${complete.size} / ${TOTAL}`;
    const nearest = game.ghosts.slice().sort((a,b) => Math.hypot(a.x-game.player.x,a.y-game.player.y)-Math.hypot(b.x-game.player.x,b.y-game.player.y))[0];
    els.gameMainState.textContent = nearest?.state || "PATROL";
    els.ghostMonitor.innerHTML = game.ghosts.map((ghost, index) => {
      const distance = Number.isFinite(ghost.distance) ? `${ghost.distance} units` : "distance pending";
      const tile = `(${Math.floor(ghost.y)}, ${Math.floor(ghost.x)})`;
      const cost = ghost.pathCost === null ? "" : ` · cost ${ghost.pathCost}`;
      return `<div class="ghost-reading" data-state="${ghost.state}" data-row="${Math.floor(ghost.y)}" data-col="${Math.floor(ghost.x)}"><img src="assets/${index === 0 ? "ghost-coral" : "ghost-blue"}.svg" alt=""><div class="ghost-reading-copy"><span>GHOST ${index + 1} · tile ${tile} · ${distance}</span><strong>${ghost.state}</strong><small>${ghost.action}${cost}</small></div></div>`;
    }).join("");
    const features = [["problem","BEHAVIORS"],["fsm","FSM STATES"],["conditions","RANGE RULES"],["matrix","MATRIX MAP"],["distance","GRID DISTANCE"],["grid","NEIGHBORS"],["cost","SLIME COST"],["dijkstra","DIJKSTRA"],["path-api","PATH[1] MOVE"],["recalculate","RECALCULATE"],["integration","FULL AI"],["playground","CUSTOM MAP"]];
    els.aiFeatureList.innerHTML = features.map(([id,label]) => `<span class="ai-feature${complete.has(id) ? " on" : ""}">${complete.has(id) ? "✓ " : "○ "}${label}</span>`).join("");
    els.runtimeStatus.dataset.ready = String(ready);
    els.runtimeStatus.querySelector("span").textContent = ready ? "STUDENT AI LIVE" : "VALIDATED LOGIC";
    els.runtimeStatus.querySelector("strong").textContent = ready ? "FSM → CHASE → Dijkstra → path[1]" : `AI build in progress · ${complete.size}/${TOTAL}`;
    els.runtimeStatus.querySelector("small").textContent = ready
      ? "PATROL explores junctions, CHASE recalculates the lowest-cost path, and ATTACK applies direct pressure."
      : "Only correctly submitted missions power the ghosts; skipped missions remain inactive.";
  }

  function gameLoop(time) {
    const dt = Math.min(.035, Math.max(0, (time - (game.lastTime || time)) / 1000));
    game.lastTime = time;
    if (game.running && !game.paused) updateGame(dt);
    drawGame();
    requestAnimationFrame(gameLoop);
  }

  function beep(frequency, duration, type, volume) {
    if (!game.sound) return;
    try {
      if (!game.audio) {
        if (navigator.userActivation && !navigator.userActivation.isActive) return;
        game.audio = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (game.audio.state === "suspended") game.audio.resume().catch(() => {});
      const oscillator = game.audio.createOscillator(), gain = game.audio.createGain();
      oscillator.type = type; oscillator.frequency.value = frequency; gain.gain.value = volume;
      gain.gain.exponentialRampToValueAtTime(.0001, game.audio.currentTime + duration);
      oscillator.connect(gain); gain.connect(game.audio.destination); oscillator.start(); oscillator.stop(game.audio.currentTime + duration);
    } catch (_) { /* sound is optional */ }
  }

  const SOUND_CUES = {
    start: [[0, 330, .055, "square", .024], [65, 440, .055, "square", .025], [130, 660, .09, "triangle", .03]],
    pelletLow: [[0, 620, .028, "square", .014]],
    pelletHigh: [[0, 790, .028, "square", .014]],
    coin: [[0, 660, .05, "triangle", .03], [60, 880, .07, "triangle", .032], [130, 1320, .1, "triangle", .03]],
    power: [[0, 520, .07, "square", .028], [85, 700, .08, "square", .03], [175, 940, .12, "triangle", .034]],
    ghostEaten: [[0, 900, .05, "triangle", .03], [60, 1300, .08, "triangle", .034], [150, 520, .07, "square", .022]],
    pause: [[0, 430, .05, "triangle", .02], [70, 300, .08, "triangle", .018]],
    resume: [[0, 300, .05, "triangle", .018], [70, 480, .08, "triangle", .022]],
    patrol: [[0, 260, .07, "sine", .016]],
    chase: [[0, 360, .05, "square", .018], [55, 440, .06, "square", .018]],
    attack: [[0, 190, .09, "sawtooth", .022], [75, 150, .1, "sawtooth", .018]],
    lifeLost: [[0, 330, .07, "sawtooth", .032], [80, 220, .09, "sawtooth", .03], [170, 120, .14, "sawtooth", .026]],
    gameOver: [[0, 260, .08, "square", .03], [100, 200, .08, "square", .028], [200, 145, .1, "square", .026], [320, 90, .2, "sawtooth", .025]],
    clear: [[0, 520, .07, "triangle", .028], [80, 660, .07, "triangle", .03], [160, 790, .07, "triangle", .032], [245, 1040, .16, "triangle", .035]],
    restart: [[0, 240, .04, "square", .018], [55, 360, .06, "square", .021]],
    soundOn: [[0, 440, .05, "sine", .02], [60, 660, .08, "sine", .024]]
  };

  function playCue(name) {
    const cue = SOUND_CUES[name];
    if (!cue || !game.sound) return;
    cue.forEach(([delay, frequency, duration, type, volume], index) => {
      const play = () => beep(frequency, duration, type, volume);
      if (index === 0 && delay === 0) play();
      else window.setTimeout(play, delay);
    });
  }

  // Events
  els.hintBtn.addEventListener("click", showHint);
  els.checkBtn.addEventListener("click", checkAnswer);
  els.skipBtn.addEventListener("click", skipCurrentMission);
  els.themeToggleBtn.addEventListener("click", () => {
    applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
  });
  els.prevBtn.addEventListener("click", () => { if (currentIndex > 0) { currentIndex -= 1; renderAll(); } });
  els.nextBtn.addEventListener("click", goNext);
  $("closeCompleteBtn").addEventListener("click", () => els.completeDialog.close());
  els.openDijkstraGuideBtn.addEventListener("click", () => {
    if (!els.dijkstraGuideDialog.open) els.dijkstraGuideDialog.showModal();
  });
  els.closeDijkstraGuideBtn.addEventListener("click", () => els.dijkstraGuideDialog.close());
  els.dijkstraGuideDialog.addEventListener("close", stopEmbeddedGuide);
  els.dijkstraGuideFrame.addEventListener("load", prepareEmbeddedGuide);
  if (els.dijkstraGuideFrame.contentDocument?.readyState === "complete") prepareEmbeddedGuide();
  $("resetProgressBtn").addEventListener("click", () => {
    if (!window.confirm("Reset all course progress?")) return;
    store.profile = emptyProfile();
    currentIndex = 0;
    saveStore();
    initBuilder();
    renderAll();
    syncStudentMapOption(false);
    syncPlaygroundOption(false);
    resetGame(false);
    showToast("Course progress reset");
  });
  els.fsmTab.addEventListener("click", () => openLab("fsm"));
  els.matrixTab.addEventListener("click", () => openLab("matrix"));
  els.pathTab.addEventListener("click", () => openLab("path"));
  els.playTab.addEventListener("click", () => openLab("play"));
  els.buildTab.addEventListener("click", () => openLab("build"));
  [els.fsmTab, els.matrixTab, els.pathTab, els.playTab, els.buildTab].forEach((tab) => tab.addEventListener("keydown", moveLabFocus));
  els.buildGrid.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    builder.painting = true;
    try { els.buildGrid.setPointerCapture(event.pointerId); } catch (_) { /* capture is a nicety */ }
    const pos = builderCellFromEvent(event);
    if (pos) applyBuilderTool(pos[0], pos[1]);
  });
  els.buildGrid.addEventListener("pointermove", (event) => {
    if (!builder.painting) return;
    const pos = builderCellFromEvent(event);
    if (pos) applyBuilderTool(pos[0], pos[1]);
  });
  window.addEventListener("pointerup", () => {
    if (!builder.painting) return;
    builder.painting = false;
    saveBuilder();
    syncPlaygroundOption(false);
    updateBuildChecklist();
  });
  els.buildTools.querySelectorAll(".build-tool").forEach((button) => button.addEventListener("click", () => {
    builder.tool = button.dataset.tool;
    els.buildTools.querySelectorAll(".build-tool").forEach((item) => item.classList.toggle("active", item === button));
  }));
  els.buildSize.addEventListener("input", () => {
    els.buildSizeValue.textContent = `${els.buildSize.value} × ${els.buildSize.value}`;
  });
  els.buildSize.addEventListener("change", () => resizeBuilder(Number(els.buildSize.value)));
  els.clearBuildBtn.addEventListener("click", () => {
    if (!window.confirm("Clear the whole playground map?")) return;
    builder.grid = defaultBuilderGrid(builder.size);
    builder.pacman = null;
    builder.ghosts = [null, null];
    saveBuilder();
    renderBuilder();
    syncPlaygroundOption(false);
    updateBuildChecklist();
  });
  els.playBuildBtn.addEventListener("click", playBuilderMap);
  els.runMatrixLabBtn.addEventListener("click", () => {
    if (mission().task.validator !== "matrixMap") {
      setFeedback("error", "Open the Build a matrix map mission before running student matrix code.");
      return;
    }
    checkAnswer();
  });
  els.distanceSlider.addEventListener("input", updateFSM);
  els.stepPathBtn.addEventListener("click", stepPath);
  els.runPathBtn.addEventListener("click", () => pathState.timer ? stopAuto() : startAuto());
  els.resetPathBtn.addEventListener("click", resetSearch);
  els.editCostBtn.addEventListener("click", toggleEdit);
  els.speedSelect.addEventListener("change", () => { if (pathState.timer) { stopAuto(); startAuto(); } });
  els.gamePlayBtn.addEventListener("click", startGame);
  els.gamePauseBtn.addEventListener("click", toggleGamePause);
  els.gameRestartBtn.addEventListener("click", () => { resetGame(false); playCue("restart"); });
  $("overlayPlayBtn").addEventListener("click", startGame);
  els.gameSoundBtn.addEventListener("click", () => {
    game.sound = !game.sound;
    els.gameSoundBtn.textContent = game.sound ? "Sound on" : "Sound off";
    els.gameSoundBtn.classList.toggle("active", game.sound);
    if (game.sound) playCue("soundOn");
  });
  els.gameMapSelect.addEventListener("change", () => {
    game.mapIndex = Number(els.gameMapSelect.value);
    profile().gameMapIndex = game.mapIndex;
    saveStore();
    resetGame(false);
    playCue("restart");
  });
  els.gameCanvas.addEventListener("click", () => els.gameCanvas.focus());
  window.addEventListener("keydown", (event) => {
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || target?.isContentEditable) return;
    if (!els.playLab.classList.contains("active")) return;
    const key = event.key.toLowerCase();
    const direction = key === "arrowup" || key === "w" ? DIRS.UP : key === "arrowdown" || key === "s" ? DIRS.DOWN : key === "arrowleft" || key === "a" ? DIRS.LEFT : key === "arrowright" || key === "d" ? DIRS.RIGHT : null;
    if (!direction) return;
    event.preventDefault();
    game.player.desired = { ...direction };
  });

  applyTheme(document.documentElement.dataset.theme, false);
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
  systemTheme.addEventListener?.("change", (event) => {
    try {
      if (localStorage.getItem(THEME_STORAGE_KEY)) return;
    } catch (_) { /* follow the system when storage is unavailable */ }
    applyTheme(event.matches ? "dark" : "light", false);
  });
  updateFSM();
  loadMap(0);
  initBuilder();
  game.mapIndex = Number(profile().gameMapIndex) || 0;
  els.gameMapSelect.value = String(game.mapIndex);
  syncStudentMapOption(false);
  syncPlaygroundOption(false);
  resetGame(false);
  requestAnimationFrame(gameLoop);
  const query = new URLSearchParams(window.location.search);
  // ?resume=6 marks missions 1..5 complete and starts at mission 6 — for resuming a
  // multi-session class on a device without yesterday's saved progress.
  const resume = Number(query.get("resume"));
  if (Number.isInteger(resume) && resume >= 2 && resume <= TOTAL) {
    const p = profile();
    const priorIds = COURSE_MISSIONS.slice(0, resume - 1).map((item) => item.id);
    priorIds.forEach((id) => { if (!p.completed.includes(id)) p.completed.push(id); });
    p.skipped = (p.skipped || []).filter((id) => !priorIds.includes(id));
    p.current = resume - 1;
    saveStore();
    renderGameHUD();
  }
  currentIndex = Math.min(profile().current || 0, TOTAL - 1);
  renderAll();
  const requestedLab = query.get("lab");
  if (["fsm", "matrix", "path", "play"].includes(requestedLab)) openLab(requestedLab);
  if (query.get("guide") === "1") {
    openLab("path");
    window.requestAnimationFrame(() => els.dijkstraGuideDialog.showModal());
  }
})();
