const form = document.getElementById("send-container");
const messageInput = document.getElementById("messageInp");
const messageContainer = document.querySelector(".container");

const append = (message, position) => {
  const messageElement = document.createElement("div");
  messageElement.innerText = message;
  messageElement.classList.add("message");
  messageElement.classList.add(position);
  messageContainer.append(messageElement);
};

// 🎯 Handle form submission
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = messageInput.value.trim();
  if (!message) return;

  append(`You: ${message}`, "right");
  messageInput.value = "";

  try {
    const response = await fetch("http://localhost:3000/query", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ query: message })
    });

    const result = await response.json();

    // 👀 Format output
    let display;
    if (Array.isArray(result)) {
      display = JSON.stringify(result, null, 2);
    } else if (result.message) {
      display = `✅ ${result.message}`;
      if (result.id) display += `\nID: ${result.id}`;
    } else if (result.error) {
      display = `❌ Error: ${result.error}`;
    } else {
      display = JSON.stringify(result, null, 2);
    }

    append(display, "left");
  } catch (error) {
    append(`❌ Network Error: ${error.message}`, "left");
  }
});
