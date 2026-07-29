// ============================================
// test.js — "Test Yourself" quiz engine for Be Ahead
// Loads a static question bank per language, picks a random
// subset each run, runs a countdown timer, and scores the result.
// ============================================

document.addEventListener("DOMContentLoaded", () => {
  const setupScreen = document.getElementById("setup-screen");
  const quizScreen = document.getElementById("quiz-screen");
  const resultsScreen = document.getElementById("results-screen");

  const langSelect = document.getElementById("lang-select");
  const questionCountInput = document.getElementById("question-count");
  const timeLimitInput = document.getElementById("time-limit");
  const setupError = document.getElementById("setup-error");
  const startBtn = document.getElementById("start-btn");

  const questionCounter = document.getElementById("question-counter");
  const timerDisplay = document.getElementById("timer-display");
  const progressFill = document.getElementById("progress-fill");
  const questionText = document.getElementById("question-text");
  const optionsList = document.getElementById("options-list");
  const nextBtn = document.getElementById("next-btn");

  const scoreNum = document.getElementById("score-num");
  const scoreMessage = document.getElementById("score-message");
  const reviewList = document.getElementById("review-list");
  const retryBtn = document.getElementById("retry-btn");

  let quizQuestions = [];   // the sampled+shuffled set for this run
  let currentIndex = 0;
  let selectedAnswerIndex = null;
  let userAnswers = [];     // { question, options, correctIndex, chosenIndex }
  let timerInterval = null;
  let secondsRemaining = 0;
  let lastLanguage = "python";

  // ---------- Fisher-Yates shuffle ----------
  function shuffle(array) {
    const arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // ---------- Start button ----------
  startBtn.addEventListener("click", () => {
    const lang = langSelect.value;
    const count = parseInt(questionCountInput.value, 10);
    const minutes = parseInt(timeLimitInput.value, 10);

    if (!count || count < 1 || count > 20) {
      setupError.textContent = "Enter a question count between 1 and 20.";
      return;
    }
    if (!minutes || minutes < 1 || minutes > 60) {
      setupError.textContent = "Enter a time limit between 1 and 60 minutes.";
      return;
    }
    setupError.textContent = "";
    lastLanguage = lang;

    startBtn.disabled = true;
    startBtn.textContent = "$ loading...";

    fetch(`questions/${lang}.json`)
      .then((res) => {
        if (!res.ok) throw new Error("Could not load question bank");
        return res.json();
      })
      .then((bank) => {
        const sampleSize = Math.min(count, bank.length);
        quizQuestions = shuffle(bank).slice(0, sampleSize).map((q) => ({
          ...q,
          shuffledOptions: shuffle(
            q.options.map((text, idx) => ({ text, isCorrect: idx === q.answer }))
          ),
        }));
        secondsRemaining = minutes * 60;
        currentIndex = 0;
        userAnswers = [];
        startBtn.disabled = false;
        startBtn.textContent = "$ run_test";
        showQuizScreen();
      })
      .catch((err) => {
        setupError.textContent = "Couldn't load questions. Please try again.";
        startBtn.disabled = false;
        startBtn.textContent = "$ run_test";
      });
  });

  // ---------- Quiz screen ----------
  function showQuizScreen() {
    setupScreen.style.display = "none";
    resultsScreen.style.display = "none";
    quizScreen.style.display = "block";
    startTimer();
    renderQuestion();
  }

  function startTimer() {
    clearInterval(timerInterval);
    updateTimerDisplay();
    timerInterval = setInterval(() => {
      secondsRemaining--;
      updateTimerDisplay();
      if (secondsRemaining <= 0) {
        clearInterval(timerInterval);
        finishQuiz();
      }
    }, 1000);
  }

  function updateTimerDisplay() {
    const m = Math.floor(secondsRemaining / 60);
    const s = secondsRemaining % 60;
    timerDisplay.textContent = `${m}:${s.toString().padStart(2, "0")}`;
    timerDisplay.classList.toggle("low-time", secondsRemaining <= 30);
  }

  function renderQuestion() {
    const q = quizQuestions[currentIndex];
    selectedAnswerIndex = null;
    nextBtn.disabled = true;
    nextBtn.textContent = currentIndex === quizQuestions.length - 1 ? "Finish" : "Next →";

    questionCounter.textContent = `Question ${currentIndex + 1} of ${quizQuestions.length}`;
    progressFill.style.width = `${(currentIndex / quizQuestions.length) * 100}%`;
    questionText.textContent = q.q;

    optionsList.innerHTML = "";
    q.shuffledOptions.forEach((opt, idx) => {
      const btn = document.createElement("button");
      btn.className = "option-btn";
      btn.textContent = opt.text;
      btn.addEventListener("click", () => selectOption(idx));
      optionsList.appendChild(btn);
    });
  }

  function selectOption(idx) {
    selectedAnswerIndex = idx;
    nextBtn.disabled = false;
    Array.from(optionsList.children).forEach((btn, i) => {
      btn.classList.toggle("selected", i === idx);
    });
  }

  nextBtn.addEventListener("click", () => {
    const q = quizQuestions[currentIndex];
    const chosen = selectedAnswerIndex !== null ? q.shuffledOptions[selectedAnswerIndex] : null;

    userAnswers.push({
      question: q.q,
      chosenText: chosen ? chosen.text : "(skipped)",
      correctText: q.shuffledOptions.find((o) => o.isCorrect).text,
      isCorrect: chosen ? chosen.isCorrect : false,
    });

    if (currentIndex < quizQuestions.length - 1) {
      currentIndex++;
      renderQuestion();
    } else {
      clearInterval(timerInterval);
      finishQuiz();
    }
  });

  // ---------- Results screen ----------
  function finishQuiz() {
    quizScreen.style.display = "none";
    resultsScreen.style.display = "block";

    const correctCount = userAnswers.filter((a) => a.isCorrect).length;
    const total = quizQuestions.length;
    scoreNum.textContent = `${correctCount}/${total}`;

    const pct = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    let msg;
    if (pct === 100) msg = "Perfect score! You know this cold.";
    else if (pct >= 70) msg = "Solid work — you clearly know your stuff.";
    else if (pct >= 40) msg = "Decent start. A bit more practice and you'll nail it.";
    else msg = "Rough round — go back through the material and try again.";
    scoreMessage.textContent = msg;

    reviewList.innerHTML = "";
    userAnswers.forEach((a, i) => {
      const item = document.createElement("div");
      item.className = `review-item ${a.isCorrect ? "right" : "wrong"}`;
      item.innerHTML = `
        <div class="review-q">${i + 1}. ${a.question}</div>
        <div class="review-answer">
          ${a.isCorrect ? "✓ " + a.chosenText : "✗ Your answer: " + a.chosenText + " — Correct: " + a.correctText}
        </div>
      `;
      reviewList.appendChild(item);
    });
  }

  retryBtn.addEventListener("click", () => {
    resultsScreen.style.display = "none";
    setupScreen.style.display = "block";
    langSelect.value = lastLanguage;
  });
});
