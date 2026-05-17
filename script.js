const button = document.getElementById("beai-button");
const chatBox = document.getElementById("chat-box");
const chatWindow = document.getElementById("beai-chat");
const closeBtn = document.getElementById("close-btn");
const sendBtn = document.getElementById("send-btn");
const input = document.getElementById("user-input");

// Open chat
button.addEventListener("click", () => {
  chatWindow.style.display = "flex";
});

// Close chat
closeBtn.addEventListener("click", () => {
  chatWindow.style.display = "none";
});

// Basic coding filter (frontend level)
function isCodingQuestion(text) {
  const keywords = [
    "html", "css", "javascript", "python", "java",
    "code", "function", "array", "loop", "api",
    "program", "react", "node", "variable"
  ];

  return keywords.some(word => text.toLowerCase().includes(word));
}

// Send message
sendBtn.addEventListener("click", async () => {
  const message = input.value.trim();

  if (!message) return;

  // Show user message
  chatBox.innerHTML += `<p><b>You:</b> ${message}</p>`;

  input.value = "";

  // Block non-coding questions
  if (!isCodingQuestion(message)) {
    chatBox.innerHTML += `<p><b>Be AI:</b> Invalid question ❌ Only coding-related questions allowed.</p>`;
    return;
  }

  // Loading text
  const loadingMsg = document.createElement("p");
  loadingMsg.innerText = "Be AI: Processing your coding question...";
  chatBox.appendChild(loadingMsg);

  try {
    const res = await fetch("/api/beai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message })
    });

    const data = await res.json();

    // Remove loading text
    loadingMsg.remove();

    // Show AI reply
    chatBox.innerHTML += `<p><b>Be AI:</b> ${data.reply}</p>`;

  } catch (error) {
    loadingMsg.remove();
    chatBox.innerHTML += `<p><b>Be AI:</b> Error connecting to server ❌</p>`;
  }
});