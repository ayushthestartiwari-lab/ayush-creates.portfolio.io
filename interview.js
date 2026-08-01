// ---------- interview.js ----------
// Phase 1 scaffold: camera/mic, TTS questions, STT answers, transcript log,
// fixed question bank, timer. Face-tracking metrics + Gemini report are
// wired in Phase 2/3 — see TODOs below.

(() => {
  "use strict";

  // ---- question banks (fixed for MVP) ----
  const QUESTION_BANKS = {
    python: [
      "Tell me a bit about your experience with Python.",
      "What's the difference between a list and a tuple?",
      "How would you handle an exception in Python?",
      "Explain what a decorator is, in your own words.",
      "Describe a project where you used Python to solve a real problem."
    ],
    javascript: [
      "Tell me a bit about your experience with JavaScript.",
      "What's the difference between var, let, and const?",
      "Can you explain what a closure is?",
      "How does asynchronous code work in JavaScript?",
      "Describe a project where you used JavaScript to solve a real problem."
    ],
    java: [
      "Tell me a bit about your experience with Java.",
      "What's the difference between an interface and an abstract class?",
      "How does garbage collection work in Java?",
      "Explain what encapsulation means, in your own words.",
      "Describe a project where you used Java to solve a real problem."
    ],
    go: [
      "Tell me a bit about your experience with Go.",
      "What's a goroutine, and how is it different from a thread?",
      "How does Go handle error handling differently from other languages?",
      "Explain what a channel is used for.",
      "Describe a project where you used Go to solve a real problem."
    ],
    rust: [
      "Tell me a bit about your experience with Rust.",
      "Can you explain ownership and borrowing in your own words?",
      "What problem does the borrow checker solve?",
      "How does Rust handle error handling without exceptions?",
      "Describe a project where you used Rust to solve a real problem."
    ],
    html: [
      "Tell me a bit about your experience with HTML.",
      "What's the difference between a block-level and inline element?",
      "Why do semantic tags like <header> or <article> matter over plain <div>s?",
      "How would you make a form accessible to screen readers?",
      "Describe a project where you built or structured a page from scratch."
    ],
    general: [
      "Tell me a bit about yourself and what you're working on.",
      "Describe a challenging problem you solved recently.",
      "How do you approach learning a new technology?",
      "Tell me about a time you had to debug something tricky.",
      "Where do you want to be in your career a year from now?"
    ]
  };

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
    try {
      const MODEL_URL = "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js/weights";
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      faceModelsLoaded = true;
      return true;
    } catch (err) {
      console.error("face-api model load failed:", err);
      return false;
    }
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

  // polls until a face is seen, or times out (interview still proceeds
  // either way — this is a nudge, not a hard gate)
  function waitForFace(timeoutMs = 8000) {
    return new Promise((resolve) => {
      const startedAt = Date.now();
      const poll = async () => {
        const visible = await isFaceVisible();
        updateFaceBadge(visible);
        if (visible || Date.now() - startedAt > timeoutMs) {
          resolve(visible);
          return;
        }
        setTimeout(poll, 400);
      };
      poll();
    });
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
      const voices = window.speechSynthesis.getVoices();
      if (voices.length) {
        resolve(voices);
        return;
      }
      // voices load async in some browsers (esp. on first page load)
      window.speechSynthesis.onvoiceschanged = () => {
        resolve(window.speechSynthesis.getVoices());
      };
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
      utter.onend = () => resolve();
      utter.onerror = () => resolve();
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
  async function runQuestion(index) {
    const q = state.questions[index];
    el.questionCounter.textContent = `Q ${index + 1} / ${state.questions.length}`;
    appendLog("ai", q);

    await speak(q);
    const answer = await listenForAnswer();
    appendLog("user", answer);

    state.transcript.push({ question: q, answer });
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
    state.questions = QUESTION_BANKS[state.topic] || QUESTION_BANKS.general;
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
      const faceOk = await waitForFace(8000);
      if (faceOk) {
        appendLog("sys", "# face detected — starting interview.");
      } else {
        const warning =
          "I can't clearly see your face. Please check that your camera is on and centered before we continue.";
        appendLog("sys", "# " + warning);
        await speak(warning);
      }
      startFaceMonitor();
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
