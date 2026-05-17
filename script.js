const button = document.getElementById("beai-button");
const chat = document.getElementById("beai-chat");
const closeBtn = document.getElementById("close-btn");
const sendBtn = document.getElementById("send-btn");
const input = document.getElementById("user-input");
const chatBox = document.getElementById("chat-box");

// Open chat
button.onclick = () => {
  chat.style.display = "flex";
};

// Close chat
closeBtn.onclick = () => {
  chat.style.display = "none";
};

// Send message
sendBtn.onclick = () => {
  const message = input.value;

  if (message.trim() === "") return;

  chatBox.innerHTML += `<p><b>You:</b> ${message}</p>`;

  input.value = "";

  // Fake Be AI reply for now
  chatBox.innerHTML += `<p><b>Be AI:</b> Processing your coding question...</p>`;
};