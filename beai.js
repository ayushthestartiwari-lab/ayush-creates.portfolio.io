// beai.js — BeAI chatbot widget (client-side)
// Talks only to our own /api/beai serverless function.
// No API key ever lives in this file — that's the whole point.

document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("beai-chatbot");
  const chatWindow = document.getElementById("beai-window");
  const header = document.getElementById("beai-header");
  const messagesEl = document.getElementById("beai-messages");
  const input = document.getElementById("beai-input");

  if (!toggleBtn || !chatWindow || !messagesEl || !input) return;

  // Defensive: set these here (not just in home.html's markup) so the
  // widget is keyboard-accessible on every page it's included on, even
  // pages whose markup hasn't been updated with these attributes yet.
  if (!toggleBtn.hasAttribute("role")) toggleBtn.setAttribute("role", "button");
  if (!toggleBtn.hasAttribute("tabindex")) toggleBtn.setAttribute("tabindex", "0");
  if (!toggleBtn.hasAttribute("aria-label")) toggleBtn.setAttribute("aria-label", "Open Be AI chat");
  toggleBtn.setAttribute("aria-expanded", "false");

  // Conversation history kept in memory (per page load), sent to the
  // API so BeAI has context across turns within this chat.
  let history = [];
  let isSending = false;

  // Greet once
  addMessage(
    "model",
    "Hey! I'm BeAI 👋 Ask me anything about Python, JavaScript, Java, Go, HTML, or Rust."
  );

  chatWindow.style.display = "none";

  function toggleChat() {
    const isOpen = chatWindow.style.display === "flex";
    chatWindow.style.display = isOpen ? "none" : "flex";
    toggleBtn.setAttribute("aria-expanded", String(!isOpen));
    if (!isOpen) input.focus();
  }

  toggleBtn.addEventListener("click", toggleChat);

  // toggleBtn is a <div role="button">, not a real <button>, so
  // keyboard activation (Enter/Space) has to be wired up by hand —
  // browsers only do this automatically for native interactive elements.
  toggleBtn.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleChat();
    }
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  async function sendMessage() {
    const text = input.value.trim();
    if (!text || isSending) return;

    addMessage("user", text);
    input.value = "";
    isSending = true;

    const typingEl = addMessage("model", "Thinking…", true);

    try {
      const res = await fetch("/api/beai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      });

      const data = await res.json();
      typingEl.remove();

      if (!res.ok) {
        addMessage("model", data.error || "Something went wrong. Please try again.");
        if (data.limitReached) {
          input.disabled = true;
          input.placeholder = "Daily limit reached";
        }
      } else {
        addMessage("model", data.reply);
        history.push({ role: "user", text });
        history.push({ role: "model", text: data.reply });
      }
    } catch (err) {
      typingEl.remove();
      addMessage("model", "Network error — please check your connection and try again.");
    } finally {
      isSending = false;
    }
  }

  function addMessage(role, text, isTemp = false) {
    const bubble = document.createElement("div");
    bubble.className = `beai-msg beai-msg-${role}`;
    bubble.textContent = text;
    if (isTemp) bubble.classList.add("beai-msg-temp");
    messagesEl.appendChild(bubble);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return bubble;
  }
});
