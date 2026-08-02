// ---------- interview.js ----------
// Phase 1 scaffold: camera/mic, TTS questions, STT answers, transcript log,
// fixed question bank, timer. Face-tracking now uses MediaPipe Face
// Landmarker (real iris-based gaze) instead of face-api.js.

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
    listening: false,
    ended: false, // true once the interview has been ended (early or naturally) — guards the loop
    reportRequested: false
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

  // ---- face tracking: presence + gaze (MediaPipe Face Landmarker) ----
  // Presence ("visible") gates pausing the interview — it's about whether
  // they're physically in frame. Gaze ("lookingAtCamera") is a lighter-touch
  // signal used only for the eye-contact stat in the report — glancing at
  // notes shouldn't pause anything, it should just show up as lower % later.

  const MEDIAPIPE_VERSION = "0.10.14";
  const WASM_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`;
  const MODEL_URL =
    "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

  let faceLandmarker = null; // MediaPipe FaceLandmarker instance once loaded
  let faceModelsLoaded = false;
  let faceMonitorHandle = null;
  let faceMonitorRunning = false; // guards against overlapping detector calls if one is slow

  const faceStats = {}; // { [questionIndex]: { visibleCount, lookingCount, total, lookAwayEvents } }

  // rolling-window majority vote so a single bad frame (motion blur, brief
  // occlusion) doesn't flicker the badge or pollute the stats
  const SMOOTHING_WINDOW = 3;
  let recentVisible = [];
  let recentLooking = [];

  function pushSmoothed(buffer, value) {
    buffer.push(value);
    if (buffer.length > SMOOTHING_WINDOW) buffer.shift();
    const trueCount = buffer.filter(Boolean).length;
    return trueCount > buffer.length / 2;
  }

  function recordFaceSample(index, visible, lookingAtCamera) {
    if (index < 0) return; // not in a question yet (e.g. during greeting)
    if (!faceStats[index]) faceStats[index] = { visibleCount: 0, lookingCount: 0, total: 0, lookAwayEvents: 0 };
    faceStats[index].total++;
    if (visible) faceStats[index].visibleCount++;
    if (lookingAtCamera) faceStats[index].lookingCount++;
  }

  function recordLookAwayEvent(index) {
    if (index < 0) return;
    if (!faceStats[index]) faceStats[index] = { visibleCount: 0, lookingCount: 0, total: 0, lookAwayEvents: 0 };
    faceStats[index].lookAwayEvents++;
  }

  async function ensureFaceModelsLoaded() {
    if (faceModelsLoaded) return true;

    // whichever finishes first — never let a slow/blocked CDN hang the interview
    const timeout = new Promise((resolve) => setTimeout(() => resolve(false), 8000));

    const load = (async () => {
      const vision = await import(
        `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}`
      ).catch((err) => {
        console.error("MediaPipe module load failed:", err);
        return null;
      });
      if (!vision) return false;

      const { FaceLandmarker, FilesetResolver } = vision;

      try {
        const filesetResolver = await FilesetResolver.forVisionTasks(WASM_URL);

        // try GPU delegate first (faster), fall back to CPU on devices/
        // browsers where WebGL delegate init fails
        try {
          faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
            baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
            runningMode: "VIDEO",
            numFaces: 1,
            outputFaceBlendshapes: false,
            outputFacialTransformationMatrixes: false
          });
        } catch (gpuErr) {
          console.warn("GPU delegate failed, falling back to CPU:", gpuErr);
          faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
            baseOptions: { modelAssetPath: MODEL_URL, delegate: "CPU" },
            runningMode: "VIDEO",
            numFaces: 1,
            outputFaceBlendshapes: false,
            outputFacialTransformationMatrixes: false
          });
        }

        faceModelsLoaded = true;
        return true;
      } catch (err) {
        console.error("MediaPipe FaceLandmarker load failed:", err);
        return false;
      }
    })();

    return Promise.race([load, timeout]);
  }

  // MediaPipe's face mesh includes real iris landmarks (indices 468-477),
  // so gaze is estimated from where the iris sits within the eye socket
  // rather than head yaw — more accurate than a nose-offset proxy, and
  // catches "eyes flicking to notes" even when the head barely moves.
  const LEFT_EYE_CORNERS = [33, 133];
  const RIGHT_EYE_CORNERS = [362, 263];
  const LEFT_IRIS_CENTER = 468;
  const RIGHT_IRIS_CENTER = 473;

  function irisRatioForEye(landmarks, cornerIdxA, cornerIdxB, irisIdx) {
    const a = landmarks[cornerIdxA];
    const b = landmarks[cornerIdxB];
    const iris = landmarks[irisIdx];
    if (!a || !b || !iris) return null;

    const minX = Math.min(a.x, b.x);
    const maxX = Math.max(a.x, b.x);
    const span = maxX - minX;
    if (span < 0.001) return null; // eye too small/occluded to read

    // 0 = iris at outer corner, 1 = iris at inner corner, 0.5 = centered
    return (iris.x - minX) / span;
  }

  function estimateGaze(landmarks) {
    const leftRatio = irisRatioForEye(landmarks, LEFT_EYE_CORNERS[0], LEFT_EYE_CORNERS[1], LEFT_IRIS_CENTER);
    const rightRatio = irisRatioForEye(landmarks, RIGHT_EYE_CORNERS[0], RIGHT_EYE_CORNERS[1], RIGHT_IRIS_CENTER);

    const ratios = [leftRatio, rightRatio].filter((r) => r !== null);
    if (!ratios.length) return true; // couldn't read either eye — fail open

    const avgRatio = ratios.reduce((sum, r) => sum + r, 0) / ratios.length;

    // tolerance around center (0.5) — tuned empirically, adjust if too
    // strict/loose
    const GAZE_TOLERANCE = 0.18;
    return Math.abs(avgRatio - 0.5) <= GAZE_TOLERANCE;
  }

  // single source of truth for a face-detection read: returns both
  // presence and gaze in one detector pass
  async function detectFaceState() {
    if (!faceModelsLoaded || !faceLandmarker) return { visible: true, lookingAtCamera: true }; // fail open — never block on detector issues

    try {
      const result = faceLandmarker.detectForVideo(el.camPreview, performance.now());
      const landmarks = result.faceLandmarks && result.faceLandmarks[0];

      if (!landmarks) return { visible: false, lookingAtCamera: false };
      return { visible: true, lookingAtCamera: estimateGaze(landmarks) };
    } catch (err) {
      return { visible: true, lookingAtCamera: true }; // fail open
    }
  }

  function updateFaceBadge(visible, lookingAtCamera) {
    if (!el.faceBadge) return;
    let label, cls;
    if (!visible) {
      label = "face: not detected";
      cls = "warn";
    } else if (!lookingAtCamera) {
      label = "face: visible (look at camera)";
      cls = "warn";
    } else {
      label = "face: visible";
      cls = "ok";
    }
    el.faceBadge.textContent = label;
    el.faceBadge.className = "face-badge " + cls;
  }

  // pauses the interview flow (not just a warning) and periodically
  // reminds the person out loud until a face is seen again. Debounces a
  // single dropped frame before committing to the pause flow, and fails
  // open if the model never loaded.
  async function ensureFaceVisibleBeforeSpeaking() {
    if (state.ended) return;

    let { visible, lookingAtCamera } = await detectFaceState();
    updateFaceBadge(visible, lookingAtCamera);
    if (visible) return;

    // one dropped frame shouldn't interrupt the interview — re-check once
    // more before trusting a "not visible" reading enough to pause and speak
    await new Promise((r) => setTimeout(r, 400));
    if (state.ended) return;
    ({ visible, lookingAtCamera } = await detectFaceState());
    updateFaceBadge(visible, lookingAtCamera);
    if (visible) return;

    appendLog("sys", "# face not visible — pausing until you're back in frame.");
    recordLookAwayEvent(state.currentIndex);
    await speak(
      "I can't see your face right now. Please make sure your camera is on and you're centered in frame."
    );

    let secondsWaited = 0;
    while (!visible) {
      if (state.ended) return; // interview was ended while we were waiting on the face
      await new Promise((r) => setTimeout(r, 1000));
      ({ visible, lookingAtCamera } = await detectFaceState());
      updateFaceBadge(visible, lookingAtCamera);
      secondsWaited++;
      if (!visible && secondsWaited % 12 === 0) {
        await speak("Still waiting — I need to see your face before we continue.");
      }
    }

    appendLog("sys", "# face detected again — continuing.");
    await speak("Great, I can see you now. Let's continue.");
  }

  // self-rescheduling instead of setInterval so a slow detection call on a
  // lower-end device can never overlap with the next tick
  function startFaceMonitor() {
    stopFaceMonitor();
    faceMonitorRunning = true;
    recentVisible = [];
    recentLooking = [];

    const tick = async () => {
      if (!faceMonitorRunning) return;
      const { visible, lookingAtCamera } = await detectFaceState();
      if (!faceMonitorRunning) return; // stopped while the detection call was in flight

      const smoothedVisible = pushSmoothed(recentVisible, visible);
      const smoothedLooking = pushSmoothed(recentLooking, lookingAtCamera);

      updateFaceBadge(smoothedVisible, smoothedLooking);
      recordFaceSample(state.currentIndex, smoothedVisible, smoothedLooking);
      faceMonitorHandle = setTimeout(tick, 1200);
    };

    faceMonitorHandle = setTimeout(tick, 1200);
  }

  function stopFaceMonitor() {
    faceMonitorRunning = false;
    if (faceMonitorHandle) {
      clearTimeout(faceMonitorHandle);
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
      if (state.ended) {
        resolve();
        return;
      }

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
      utter.rate = 1.05;
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

      // known Chrome/Edge bug: calling cancel() and speak() in the same
      // tick can silently drop the new utterance — a tiny delay avoids it
      window.speechSynthesis.cancel();
      setTimeout(() => window.speechSynthesis.speak(utter), 60);
    });
  }

  // ---- STT (user answers) ----
  // Uses continuous + interim results so WE decide when the person is
  // actually done, instead of relying on the browser's own (often too
  // short, ~1-2s) built-in pause detection. A person pausing to think for
  // a couple seconds mid-answer will no longer get cut off.
  function listenForAnswer() {
    return new Promise((resolve) => {
      if (state.ended) {
        resolve("(interview ended)");
        return;
      }

      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        el.micState.textContent = "speech recognition not supported in this browser";
        resolve("(speech recognition unavailable — please use Chrome or Edge)");
        return;
      }

      const SILENCE_TIMEOUT_MS = 3500; // how long a pause has to be before we consider them done
      const MAX_DURATION_MS = 60000; // hard cap so it can never listen forever

      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.continuous = true; // don't auto-stop on the first short pause
      recognition.interimResults = true; // needed so we can reset the silence timer as they talk
      recognition.maxAlternatives = 1;

      let finalText = "";
      let silenceTimer = null;
      let stopped = false;

      const stopListening = () => {
        if (stopped) return;
        stopped = true;
        clearTimeout(silenceTimer);
        clearTimeout(maxTimer);
        try { recognition.stop(); } catch (e) { /* noop */ }
      };

      const resetSilenceTimer = () => {
        clearTimeout(silenceTimer);
        silenceTimer = setTimeout(stopListening, SILENCE_TIMEOUT_MS);
      };

      const maxTimer = setTimeout(stopListening, MAX_DURATION_MS);

      recognition.onstart = () => {
        el.micDot.className = "mic-dot listening";
        el.micState.textContent = "your turn — go ahead";
        resetSilenceTimer(); // also gives them a few seconds to start talking
      };

      recognition.onspeechstart = () => {
        el.micDot.className = "mic-dot listening";
        el.micState.textContent = "listening...";
      };

      recognition.onresult = (event) => {
        let finalChunk = "";
        for (let i = 0; i < event.results.length; i++) {
          if (event.results[i].isFinal) finalChunk += event.results[i][0].transcript + " ";
        }
        if (finalChunk.trim()) finalText = finalChunk.trim();
        // any speech — final or still-forming — means they're not done yet
        resetSilenceTimer();
      };

      recognition.onspeechend = () => {
        // the browser thinks they paused, but we don't stop here — our
        // own longer silence timer decides, so a thinking pause is fine
        el.micState.textContent = "thinking...";
      };

      recognition.onerror = (event) => {
        // "no-speech" fires naturally during a pause in continuous mode —
        // not a real error, our silence timer handles actual completion
        if (event.error !== "no-speech") {
          stopListening();
        }
      };

      recognition.onend = () => {
        el.micDot.className = "mic-dot";
        el.micState.textContent = "processing your answer...";
        clearTimeout(silenceTimer);
        clearTimeout(maxTimer);
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

  const STUCK_PHRASES = [
    "Don't worry, that happens. Let's try a different question instead.",
    "No problem at all — let's switch to something else.",
    "That's alright, let's try an easier one instead.",
    "Totally fine, take it easy — let's move to a different question."
  ];

  function randomAck() {
    return ACK_PHRASES[Math.floor(Math.random() * ACK_PHRASES.length)];
  }

  function randomStuckResponse() {
    return STUCK_PHRASES[Math.floor(Math.random() * STUCK_PHRASES.length)];
  }

  // treats an empty, near-empty, or "I don't know"-style answer as the
  // person being stuck, rather than a real attempt
  function isStuckAnswer(answer) {
    if (!answer) return true;
    const trimmed = answer.trim().toLowerCase();
    if (!trimmed || trimmed === "(no answer captured)") return true;
    const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
    if (wordCount <= 2) return true;
    const stuckPhrases = ["i don't know", "i dont know", "not sure", "no idea", "i can't", "i cant", "pass", "skip"];
    return stuckPhrases.some((p) => trimmed.includes(p));
  }

  // pulls a fresh question from the topic's full pool that hasn't already
  // been used this session — returns null if the pool is exhausted
  function pickReplacementQuestion(topic, usedQuestions) {
    const pool = QUESTION_BANKS[topic] || QUESTION_BANKS.general;
    const used = new Set(usedQuestions);
    const candidates = pool.filter((q) => !used.has(q));
    if (!candidates.length) return null;
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  // asks the fast Groq endpoint for a content-aware one-liner reacting to
  // the actual answer — races against a short timeout so a slow/failed
  // call NEVER holds up the interview; falls back to a canned line
  async function getSmartAck(question, answer) {
    if (isStuckAnswer(answer)) return null; // handled separately by the stuck-response flow

    const fetchAck = (async () => {
      try {
        const res = await fetch("/api/interview-ack", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question, answer })
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.ack || null;
      } catch (err) {
        return null;
      }
    })();

    const timeout = new Promise((resolve) => setTimeout(() => resolve(null), 2500));
    return Promise.race([fetchAck, timeout]);
  }

  async function runQuestion(index) {
    if (state.ended) return;

    // re-check the camera before every question, not just at the start —
    // this is what catches someone stepping out of frame mid-interview
    await ensureFaceVisibleBeforeSpeaking();
    if (state.ended) return; // could've been ended while waiting on the face

    let q = state.questions[index];
    let alreadySwapped = false;
    let answer;

    while (true) {
      if (state.ended) return;

      el.questionCounter.textContent = `Q ${index + 1} / ${state.questions.length}`;
      appendLog("ai", q);
      await speak(q);
      if (state.ended) return;

      answer = await listenForAnswer();
      if (state.ended) return;
      appendLog("user", answer);

      if (isStuckAnswer(answer) && !alreadySwapped) {
        alreadySwapped = true;
        const comfort = randomStuckResponse();
        appendLog("ai", comfort);
        await speak(comfort);
        if (state.ended) return;

        const replacement = pickReplacementQuestion(state.topic, state.questions);
        if (replacement) {
          q = replacement;
          state.questions[index] = replacement; // keep counter/report consistent
          continue; // re-ask with the new question instead of moving on
        }
        // no fresh question left in the pool — accept what we have and move on
      }

      break;
    }

    state.transcript.push({ question: q, answer });

    // human-like beat before moving on — a content-aware reaction if the
    // fast AI call comes back in time, a canned one otherwise
    const smartAck = await getSmartAck(q, answer);
    if (state.ended) return;

    const isLast = index === state.questions.length - 1;
    const transition =
      (smartAck || randomAck()) + (isLast ? " That wraps up our questions." : " Let's move to the next question.");
    appendLog("ai", transition);
    await speak(transition);
  }

  async function runInterview() {
    const greeting =
      `Hi there! I'm your AI interviewer for today. We're going to go through ${state.questions.length} questions on ${state.topic}. ` +
      `Just relax and answer naturally, like you would in a real conversation. Let's get started.`;
    appendLog("ai", greeting);
    await speak(greeting);
    if (state.ended) return;

    for (let i = 0; i < state.questions.length; i++) {
      if (state.ended) return; // bail immediately if the interview was ended early
      state.currentIndex = i;
      await runQuestion(i);
    }

    if (!state.ended) endInterview();
  }

  async function startInterview() {
    el.permError.hidden = true;
    state.topic = el.topicSelect.value;
    const pool = QUESTION_BANKS[state.topic] || QUESTION_BANKS.general;
    state.questions = shuffleArray(pool).slice(0, QUESTIONS_PER_SESSION);
    state.transcript = [];
    state.currentIndex = -1;
    state.reportRequested = false;
    state.ended = false;

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
      updateFaceBadge(true, true);
    }

    setStatus("live", "interview live");
    startTimer();
    appendLog("sys", `# topic: ${state.topic} — ${state.questions.length} questions`);

    runInterview();
  }

  async function endInterview() {
    // set this FIRST — any in-flight speak()/listenForAnswer()/runQuestion()
    // step checks this flag as soon as it wakes up and bails instead of
    // continuing to the next question on a stream/mic that's about to die
    if (state.ended) return; // already ending/ended — avoid double teardown
    state.ended = true;

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
          transcript: state.transcript,
          faceMetrics: buildFaceMetricsSummary()
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

  function buildFaceMetricsSummary() {
    return state.transcript.map((t, i) => {
      const stat = faceStats[i];
      // eye_contact_percent reflects real iris-based gaze (lookingCount)
      const eyeContactPercent = stat && stat.total > 0 ? Math.round((stat.lookingCount / stat.total) * 100) : null;
      return {
        question_index: i,
        eye_contact_percent: eyeContactPercent,
        looked_away_events: stat ? stat.lookAwayEvents : 0
      };
    });
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

    if (report.camera_presence) {
      const presenceP = document.createElement("p");
      presenceP.className = "term-line";
      const pct = report.camera_presence.average_eye_contact_percent;
      presenceP.textContent =
        (pct !== null && pct !== undefined ? `eye contact: ~${pct}% of the time. ` : "") +
        (report.camera_presence.note || "");
      addBlock("camera_presence", presenceP);
    }

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
