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

  // TODO Phase 2: load face-api.js models here and run detection on a
  // requestAnimationFrame loop against #camPreview, drawing landmarks to
  // #faceCanvas and pushing per-question metrics (eye-contact %, blink
  // rate, dominant expression) into state.transcript[i].metrics.

  // ---- TTS (AI asks the question) ----
  function speak(text) {
    return new Promise((resolve) => {
      if (!("speechSynthesis" in window)) {
        // no TTS support — just resolve immediately, question is still
        // shown as text in the transcript
        resolve();
        return;
      }
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 1;
      utter.pitch = 1;
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
        el.micState.textContent = "listening...";
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

    el.startBtn.disabled = true;
    const ok = await requestMedia();
    el.startBtn.disabled = false;
    if (!ok) return;

    el.setupPanel.hidden = true;
    el.interviewPanel.hidden = false;
    setStatus("live", "interview live");
    startTimer();
    appendLog("sys", `# topic: ${state.topic} — ${state.questions.length} questions`);

    runInterview();
  }

  function endInterview() {
    if (state.recognition) {
      try { state.recognition.stop(); } catch (e) { /* noop */ }
    }
    window.speechSynthesis.cancel();
    stopTimer();
    stopMedia();
    setStatus("ready", "interview ended");

    el.interviewPanel.hidden = true;
    el.reportPanel.hidden = false;

    // TODO Phase 3: POST state.transcript (+ face metrics) to
    // /api/interview-report, render the returned report here instead
    // of this placeholder.
    el.reportBody.textContent =
      "# report generation not wired up yet (Phase 3)\n\n" +
      state.transcript
        .map((t, i) => `Q${i + 1}: ${t.question}\nA${i + 1}: ${t.answer}\n`)
        .join("\n");
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
