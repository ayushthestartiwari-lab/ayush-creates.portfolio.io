// ---------- interview.js ----------
// Phase 1 scaffold: camera/mic, TTS questions, STT answers, transcript log,
// fixed question bank, timer. Face-tracking metrics + Gemini report are
// wired in Phase 2/3 — see TODOs below.

(() => {
  "use strict";

  // ---- question banks (larger pools — 5 are randomly picked per session,
  // guaranteed no repeats within that session) ----
  const QUESTION_BANKS = {
    python: [
      "Tell me a bit about your experience with Python.",
      "What's the difference between a list and a tuple?",
      "How would you handle an exception in Python?",
      "Explain what a decorator is, in your own words.",
      "Describe a project where you used Python to solve a real problem.",
      "What's the difference between a shallow copy and a deep copy?",
      "How do you manage dependencies in a Python project?",
      "What's the difference between a list comprehension and a generator expression?",
      "How does Python's garbage collection work, roughly?",
      "What's the difference between `is` and `==` in Python?",
      "How would you debug a Python script that's running slower than expected?",
      "What's a context manager, and when would you use `with`?",
      "How do you handle multiple return values from a function in Python?",
      "What's the difference between `*args` and `**kwargs`?",
      "How would you structure a medium-sized Python project's folders?"
    ],
    javascript: [
      "Tell me a bit about your experience with JavaScript.",
      "What's the difference between var, let, and const?",
      "Can you explain what a closure is?",
      "How does asynchronous code work in JavaScript?",
      "Describe a project where you used JavaScript to solve a real problem.",
      "What's the difference between `==` and `===`?",
      "How would you explain the event loop to someone new to JS?",
      "What's the difference between `null` and `undefined`?",
      "How do promises differ from callbacks?",
      "What's event delegation, and why is it useful?",
      "How would you debug a memory leak in a web app?",
      "What's the difference between synchronous and asynchronous JavaScript?",
      "How does `this` behave differently in arrow functions vs regular functions?",
      "What's the purpose of the `fetch` API?",
      "How would you optimize a slow-loading webpage?"
    ],
    java: [
      "Tell me a bit about your experience with Java.",
      "What's the difference between an interface and an abstract class?",
      "How does garbage collection work in Java?",
      "Explain what encapsulation means, in your own words.",
      "Describe a project where you used Java to solve a real problem.",
      "What's the difference between `==` and `.equals()` for objects?",
      "How does exception handling work in Java?",
      "What's the difference between a checked and unchecked exception?",
      "How would you explain polymorphism to someone new to programming?",
      "What's the purpose of the `static` keyword?",
      "How do you handle thread safety in Java?",
      "What's the difference between an ArrayList and a LinkedList?",
      "How would you debug a NullPointerException?",
      "What's the difference between method overloading and overriding?",
      "How does Java handle memory management compared to a language like C?"
    ],
    go: [
      "Tell me a bit about your experience with Go.",
      "What's a goroutine, and how is it different from a thread?",
      "How does Go handle error handling differently from other languages?",
      "Explain what a channel is used for.",
      "Describe a project where you used Go to solve a real problem.",
      "What's the difference between a slice and an array in Go?",
      "How does Go's garbage collector work, roughly?",
      "What's the purpose of the `defer` keyword?",
      "How would you structure a Go project with multiple packages?",
      "What's the difference between a pointer and a value receiver on a method?",
      "How do you avoid race conditions in concurrent Go code?",
      "What's the empty interface `interface{}` used for?",
      "How would you handle a panic in Go?",
      "What's the difference between buffered and unbuffered channels?",
      "How do you write and run tests in Go?"
    ],
    rust: [
      "Tell me a bit about your experience with Rust.",
      "Can you explain ownership and borrowing in your own words?",
      "What problem does the borrow checker solve?",
      "How does Rust handle error handling without exceptions?",
      "Describe a project where you used Rust to solve a real problem.",
      "What's the difference between `String` and `&str`?",
      "What's a lifetime, and why does Rust need them?",
      "How does Rust achieve memory safety without a garbage collector?",
      "What's the difference between `Option` and `Result`?",
      "How would you explain traits to someone coming from an OOP background?",
      "What's the difference between a `Vec` and an array in Rust?",
      "How does pattern matching with `match` work?",
      "What's the purpose of the `unsafe` keyword?",
      "How do you handle concurrency safely in Rust?",
      "What's the difference between stack and heap allocation in Rust?"
    ],
    html: [
      "Tell me a bit about your experience with HTML.",
      "What's the difference between a block-level and inline element?",
      "Why do semantic tags like <header> or <article> matter over plain <div>s?",
      "How would you make a form accessible to screen readers?",
      "Describe a project where you built or structured a page from scratch.",
      "What's the difference between `id` and `class` attributes?",
      "How do you make an image accessible for someone using a screen reader?",
      "What's the purpose of the `<meta viewport>` tag?",
      "How would you structure a page for good SEO?",
      "What's the difference between `<section>` and `<div>`?",
      "How do you validate an HTML form without JavaScript?",
      "What's the difference between relative and absolute paths in HTML?",
      "How would you embed a video responsively?",
      "What's the purpose of `alt` text on images?",
      "How do you handle browser compatibility for older HTML features?"
    ],
    general: [
      "Tell me a bit about yourself and what you're working on.",
      "Describe a challenging problem you solved recently.",
      "How do you approach learning a new technology?",
      "Tell me about a time you had to debug something tricky.",
      "Where do you want to be in your career a year from now?",
      "How do you prioritize tasks when you have multiple deadlines?",
      "Describe a time you disagreed with someone on a project — how did you handle it?",
      "What's a mistake you made recently, and what did you learn from it?",
      "How do you stay motivated when a project gets repetitive or boring?",
      "Tell me about a project you're genuinely proud of.",
      "How do you handle feedback or criticism on your work?",
      "What's your approach to working under a tight deadline?",
      "How do you decide when to ask for help versus figuring something out yourself?",
      "Tell me about a time you had to learn something completely new quickly.",
      "What does a good day of work look like for you?"
    ]
  };

  function shuffleArray(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  const QUESTIONS_PER_SESSION = 5;

  // ---- state ----
  const state = {
    topic: "python",
    questions: [],
    currentIndex: -1,
    transcript: [], // { question, answer }
    startedAt: null,
    timerHandle: null,
    stream: null,
    recognition: null,
    listening: false
  };

  // ---- DOM refs ----
  const el = {
    setupPanel: document.getElementById("setupPanel"),
    interviewPanel: document.getElementById("interviewPanel"),
    reportPanel: document.getElementById("reportPanel"),
    topicSelect: document.getElementById("topicSelect"),
    startBtn: document.getElementById("startBtn"),
    endBtn: document.getElementById("endBtn"),
    restartBtn: document.getElementById("restartBtn"),
    permError: document.getElementById("permError"),
    camPreview: document.getElementById("camPreview"),
    faceCanvas: document.getElementById("faceCanvas"),
    transcriptLog: document.getElementById("transcriptLog"),
    questionCounter: document.getElementById("questionCounter"),
    faceBadge: document.getElementById("faceBadge"),
    timer: document.getElementById("timer"),
    micIndicator: document.getElementById("micIndicator"),
    micDot: document.querySelector(".mic-dot"),
    micState: document.getElementById("micState"),
    statusDot: document.getElementById("statusDot"),
    statusText: document.getElementById("statusText"),
    reportBody: document.getElementById("reportBody")
  };

  // ---- helpers ----
  function setStatus(mode, label) {
    el.statusDot.className = "status-dot" + (mode ? " " + mode : "");
    el.statusText.textContent = label;
  }

  function appendLog(role, text) {
    const line = document.createElement("p");
    line.className = role === "ai" ? "ai-line" : role === "user" ? "user-line" : "sys-line";
    line.textContent = (role === "ai" ? ">>> " : "") + text;
    el.transcriptLog.appendChild(line);
    el.transcriptLog.scrollTop = el.transcriptLog.scrollHeight;
  }

  function formatTime(ms) {
    const totalSec = Math.floor(ms / 1000);
    const m = String(Math.floor(totalSec / 60)).padStart(2, "0");
    const s = String(totalSec % 60).padStart(2, "0");
    return `${m}:${s}`;
  }

  function startTimer() {
    state.startedAt = Date.now();
    state.timerHandle = setInterval(() => {
      el.timer.textContent = formatTime(Date.now() - state.startedAt);
    }, 1000);
  }

  function stopTimer() {
    clearInterval(state.timerHandle);
  }

  // ---- camera / mic ----
  async function requestMedia() {
    try {
      state.stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: true
      });
      el.camPreview.srcObject = state.stream;
      return true;
    } catch (err) {
      el.permError.hidden = false;
      el.permError.textContent =
        "# error: camera/mic permission denied or unavailable (" + err.message + ")";
      return false;
    }
  }

  function stopMedia() {
    if (state.stream) {
      state.stream.getTracks().forEach((t) => t.stop());
      state.stream = null;
    }
  }

  // TODO Phase 2 (full): also draw landmarks to #faceCanvas and derive
  // eye-contact / expression metrics for the report. For now this only
  // confirms a face is actually visible before/during the interview.

  let faceModelsLoaded = false;
  let faceMonitorHandle = null;

  async function ensureFaceModelsLoaded() {
    if (faceModelsLoaded) return true;
    if (typeof faceapi === "undefined") return false; // CDN blocked/failed

    const MODEL_URL = "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js/weights";

    const timeout = new Promise((resolve) => setTimeout(() => resolve(false), 5000));
    const load = (async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        faceModelsLoaded = true;
        return true;
      } catch (err) {
        console.error("face-api model load failed:", err);
        return false;
      }
    })();

    // whichever finishes first — never let a slow/blocked CDN hang the interview
    return Promise.race([load, timeout]);
  }

  async function isFaceVisible() {
    if (!faceModelsLoaded) return true; // fail open — never block on detector issues
    try {
      const result = await faceapi.detectSingleFace(
        el.camPreview,
        new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
      );
      return !!result;
    } catch (err) {
      return true; // fail open
    }
  }

  function updateFaceBadge(visible) {
    if (!el.faceBadge) return;
    el.faceBadge.textContent = visible ? "face: visible" : "face: not detected";
    el.faceBadge.className = "face-badge " + (visible ? "ok" : "warn");
  }

  // polls until a face is seen — pauses the interview flow (not just a
  // warning) and periodically reminds the person out loud until it can
  // actually see them. Fails open if the model never loaded.
  async function ensureFaceVisibleBeforeSpeaking() {
    let visible = await isFaceVisible();
    updateFaceBadge(visible);
    if (visible) return;

    appendLog("sys", "# face not visible — pausing until you're back in frame.");
    await speak(
      "I can't see your face right now. Please make sure your camera is on and you're centered in frame."
    );

    let secondsWaited = 0;
    while (!visible) {
      await new Promise((r) => setTimeout(r, 1000));
      visible = await isFaceVisible();
      updateFaceBadge(visible);
      secondsWaited++;
      if (!visible && secondsWaited % 12 === 0) {
        await speak("Still waiting — I need to see your face before we continue.");
      }
    }

    appendLog("sys", "# face detected again — continuing.");
    await speak("Great, I can see you now. Let's continue.");
  }

  function startFaceMonitor() {
    stopFaceMonitor();
    faceMonitorHandle = setInterval(async () => {
      const visible = await isFaceVisible();
      updateFaceBadge(visible);
    }, 1200);
  }

  function stopFaceMonitor() {
    if (faceMonitorHandle) {
      clearInterval(faceMonitorHandle);
      faceMonitorHandle = null;
    }
  }

  // ---- TTS (AI asks the question) ----
  let cachedVoices = [];

  function loadVoices() {
    return new Promise((resolve) => {
      const existing = window.speechSynthesis.getVoices();
      if (existing.length) {
        resolve(existing);
        return;
      }
      let resolved = false;
      const finish = (voices) => {
        if (resolved) return;
        resolved = true;
        resolve(voices);
      };
      window.speechSynthesis.onvoiceschanged = () => finish(window.speechSynthesis.getVoices());
      // fallback in case onvoiceschanged never fires in this browser
      setTimeout(() => finish(window.speechSynthesis.getVoices()), 1500);
    });
  }

  function pickNaturalVoice(voices) {
    // Edge ships high-quality Microsoft neural voices — these sound far
    // more human than the default robotic system voice. Preference order:
    // 1) Microsoft "Online (Natural)" voices (Edge)
    // 2) Google voices (Chrome)
    // 3) any English voice
    // 4) whatever's first
    const byNamePriority = [
      (v) => /en-US/i.test(v.lang) && /natural/i.test(v.name),
      (v) => /en-GB/i.test(v.lang) && /natural/i.test(v.name),
      (v) => /natural/i.test(v.name),
      (v) => /en-US/i.test(v.lang) && /google/i.test(v.name),
      (v) => /en/i.test(v.lang) && /online/i.test(v.name),
      (v) => /en-US/i.test(v.lang),
      (v) => /en/i.test(v.lang)
    ];

    for (const test of byNamePriority) {
      const match = voices.find(test);
      if (match) return match;
    }
    return voices[0] || null;
  }

  function speak(text) {
    return new Promise(async (resolve) => {
      if (!("speechSynthesis" in window)) {
        resolve();
        return;
      }

      if (!cachedVoices.length) {
        cachedVoices = await loadVoices();
      }

      const utter = new SpeechSynthesisUtterance(text);
      const voice = pickNaturalVoice(cachedVoices);
      if (voice) utter.voice = voice;

      // slightly slower + softer pitch reads as calmer / more human than
      // the 1/1 robotic default
      utter.rate = 0.95;
      utter.pitch = 1.02;

      el.micDot.className = "mic-dot speaking";
      el.micState.textContent = "AI speaking";

      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        resolve();
      };

      utter.onend = finish;
      utter.onerror = finish;

      // safety net: onend/onerror sometimes never fire (a known browser
      // quirk) — never let a stuck utterance freeze the whole interview
      const maxWaitMs = Math.max(4000, text.length * 110);
      setTimeout(finish, maxWaitMs);

      window.speechSynthesis.cancel(); // clear any stuck/queued utterances first
      window.speechSynthesis.speak(utter);
    });
  }

  // ---- STT (user answers) ----
  function listenForAnswer() {
    return new Promise((resolve) => {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        el.micState.textContent = "speech recognition not supported in this browser";
        resolve("(speech recognition unavailable — please use Chrome or Edge)");
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      let finalText = "";

      recognition.onstart = () => {
        el.micDot.className = "mic-dot listening";
        el.micState.textContent = "your turn — go ahead";
      };

      // fires once the API actually detects the person's voice, as
      // opposed to onstart which just means the mic is open
      recognition.onspeechstart = () => {
        el.micDot.className = "mic-dot listening";
        el.micState.textContent = "listening...";
      };

      // fires when the API detects a pause long enough to mean the
      // person is done — recognition.onend follows shortly after with
      // the final transcript
      recognition.onspeechend = () => {
        el.micDot.className = "mic-dot";
        el.micState.textContent = "processing your answer...";
      };

      recognition.onresult = (event) => {
        finalText = Array.from(event.results)
          .map((r) => r[0].transcript)
          .join(" ")
          .trim();
      };

      recognition.onerror = () => {
        // resolve with whatever we have so the interview doesn't hang
        resolve(finalText || "(no answer captured)");
      };

      recognition.onend = () => {
        el.micDot.className = "mic-dot";
        el.micState.textContent = "waiting for question";
        resolve(finalText || "(no answer captured)");
      };

      state.recognition = recognition;
      recognition.start();
    });
  }

  // ---- interview flow ----
  const ACK_PHRASES = [
    "Okay, interesting.",
    "Got it, thanks for sharing that.",
    "That makes sense.",
    "Nice, thanks for that.",
    "Alright, I hear you.",
    "Okay, good to know."
  ];

  function randomAck() {
    return ACK_PHRASES[Math.floor(Math.random() * ACK_PHRASES.length)];
  }

  async function runQuestion(index) {
    // re-check the camera before every question, not just at the start —
    // this is what catches someone stepping out of frame mid-interview
    await ensureFaceVisibleBeforeSpeaking();

    const q = state.questions[index];
    el.questionCounter.textContent = `Q ${index + 1} / ${state.questions.length}`;
    appendLog("ai", q);

    await speak(q);
    const answer = await listenForAnswer();
    appendLog("user", answer);
    state.transcript.push({ question: q, answer });

    // human-like beat before moving on, instead of firing the next
    // question immediately
    const isLast = index === state.questions.length - 1;
    const transition =
      randomAck() + (isLast ? " That wraps up our questions." : " Let's move to the next question.");
    appendLog("ai", transition);
    await speak(transition);
  }

  async function runInterview() {
    for (let i = 0; i < state.questions.length; i++) {
      state.currentIndex = i;
      await runQuestion(i);
    }
    endInterview();
  }

  async function startInterview() {
    el.permError.hidden = true;
    state.topic = el.topicSelect.value;
    const pool = QUESTION_BANKS[state.topic] || QUESTION_BANKS.general;
    state.questions = shuffleArray(pool).slice(0, QUESTIONS_PER_SESSION);
    state.transcript = [];
    state.currentIndex = -1;
    state.reportRequested = false;

    el.startBtn.disabled = true;
    const ok = await requestMedia();
    el.startBtn.disabled = false;
    if (!ok) return;

    el.setupPanel.hidden = true;
    el.interviewPanel.hidden = false;
    setStatus("live", "checking camera...");
    appendLog("sys", "# checking that your face is visible...");

    const modelsOk = await ensureFaceModelsLoaded();
    if (modelsOk) {
      startFaceMonitor(); // keeps the badge live throughout, gating happens per-question
    } else {
      updateFaceBadge(true);
    }

    setStatus("live", "interview live");
    startTimer();
    appendLog("sys", `# topic: ${state.topic} — ${state.questions.length} questions`);

    runInterview();
  }

  async function endInterview() {
    if (state.recognition) {
      try { state.recognition.stop(); } catch (e) { /* noop */ }
    }
    window.speechSynthesis.cancel();
    stopTimer();
    stopFaceMonitor();
    stopMedia();
    setStatus("ready", "interview ended");

    el.interviewPanel.hidden = true;
    el.reportPanel.hidden = false;
    el.reportBody.textContent = ">>> generating report...";

    // avoid double-submit if endInterview somehow fires twice
    if (state.reportRequested) return;
    state.reportRequested = true;

    try {
      const res = await fetch("/api/interview-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: state.topic,
          transcript: state.transcript
        })
      });

      const data = await res.json();

      if (!res.ok) {
        el.reportBody.textContent =
          `# error generating report\n${data.error || "unknown error"}${
            data.detail ? "\n" + data.detail : ""
          }`;
        return;
      }

      renderReport(data.report);
    } catch (err) {
      el.reportBody.textContent = `# network error generating report\n${err.message}`;
    }
  }

  function renderReport(report) {
    el.reportBody.innerHTML = "";

    const addBlock = (label, contentEl) => {
      const wrap = document.createElement("div");
      wrap.className = "report-block";
      const heading = document.createElement("p");
      heading.className = "sys-line";
      heading.textContent = `# ${label}`;
      wrap.appendChild(heading);
      wrap.appendChild(contentEl);
      el.reportBody.appendChild(wrap);
    };

    const scoreLine = document.createElement("p");
    scoreLine.className = "ai-line";
    scoreLine.textContent = `overall_score: ${report.overall_score} / 10`;
    addBlock("summary", scoreLine);

    const summaryP = document.createElement("p");
    summaryP.className = "term-line";
    summaryP.textContent = report.summary || "";
    el.reportBody.appendChild(summaryP);

    const strengthsList = document.createElement("ul");
    (report.strengths || []).forEach((s) => {
      const li = document.createElement("li");
      li.textContent = s;
      strengthsList.appendChild(li);
    });
    addBlock("strengths", strengthsList);

    const improveList = document.createElement("ul");
    (report.areas_to_improve || []).forEach((s) => {
      const li = document.createElement("li");
      li.textContent = s;
      improveList.appendChild(li);
    });
    addBlock("areas_to_improve", improveList);

    const perQWrap = document.createElement("div");
    (report.per_question_feedback || []).forEach((item) => {
      const q = document.createElement("p");
      q.className = "ai-line";
      q.textContent = item.question;
      const f = document.createElement("p");
      f.className = "user-line";
      f.textContent = item.feedback;
      perQWrap.appendChild(q);
      perQWrap.appendChild(f);
    });
    addBlock("per_question_feedback", perQWrap);

    const nextList = document.createElement("ul");
    (report.next_steps || []).forEach((s) => {
      const li = document.createElement("li");
      li.textContent = s;
      nextList.appendChild(li);
    });
    addBlock("next_steps", nextList);
  }

  function resetToSetup() {
    el.reportPanel.hidden = true;
    el.setupPanel.hidden = false;
    el.transcriptLog.innerHTML = "";
    el.timer.textContent = "00:00";
    setStatus("", "idle");
  }

  // ---- wiring ----
  el.startBtn.addEventListener("click", startInterview);
  el.endBtn.addEventListener("click", endInterview);
  el.restartBtn.addEventListener("click", resetToSetup);

  setStatus("", "idle");
})();
