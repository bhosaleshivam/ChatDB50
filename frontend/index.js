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

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = messageInput.value.trim();
  if (!userQuery) return;

  // Infer DB type from user input
  let dbType = "SQL"; // default
  const lowerQuery = userQuery.toLowerCase();
  if (lowerQuery.includes("nosql") || lowerQuery.includes("mongodb")) {
    dbType = "NoSQL";
   }else if (lowerQuery.includes("sql") || lowerQuery.includes("rdbms")) {
    dbType = "SQL";
   } 

  append(`You: ${message}`, `right`);
  messageInput.value = "";

  try {
    // Send to backend
    const response = await fetch("/api/generate-query", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query: userQuery,
        dbType: dbType
      })
    });

    const data = await response.json();

    // Show result
    if (data.result) {
      append(`Results:\n${JSON.stringify(data.result, null, 2)}`, "left");
    } else {
      append("No results returned.", "left");
    }

  } catch (error) {
    console.error("Error:", error);
    append("Error contacting the backend or OpenAI.", "left");
  }

  // Backend communication code
});
