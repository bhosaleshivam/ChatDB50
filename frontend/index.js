const OPENROUTER_API_KEY = "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";
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
  if (!message) return;

  // Infer DB type from user input
  let dbType = "SQL"; // default
  const lowerQuery = message.toLowerCase();
  if (lowerQuery.includes("nosql") || lowerQuery.includes("mongodb")) {
    dbType = "NoSQL";
   }else if (lowerQuery.includes("sql") || lowerQuery.includes("rdbms")) {
    dbType = "SQL";
   } 

  append(`You: ${message}`, `right`);
  messageInput.value = "";

  try {
    const prompt =
  dbType === "NoSQL"
    ? `Convert the following request into a MongoDB query using db.collection.find(...) format. Only return the query. Do not include connection, setup, or Python code.\n"${message}"`
    : `Convert the following request into a SQL query. Return ONLY the query. Do not include any explanation or assumptions.\n"${message}"`;
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "http://localhost", 
        "X-Title": "ChatDB50"
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct", 
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });
    
    const data = await response.json();
    console.log("OpenRouter Response:", data);

    // Show result
    if (data.choices && data.choices[0]?.message?.content) {
      const fullResponse = data.choices[0].message.content.trim();

// Strip out markdown code block and explanation (if any)
const extractedQuery =
  // Try to get only the code content (ignore language tag like ```javascript)
  fullResponse.match(/```(?:[a-z]+)?\s*([\s\S]*?)```/i)?.[1]?.trim()
  ||
  fullResponse
    .split("\n")
    .filter(line =>
      line.toLowerCase().startsWith("select") ||
      line.toLowerCase().startsWith("from") ||
      line.toLowerCase().startsWith("join") ||
      line.trim().startsWith("db.") ||
      line.includes(".find(")
    )
    .join("\n")
    .trim()
  ||
  fullResponse;
      append(extractedQuery, "left");
    } else {
      append("Failed to get a valid response from OpenRouter.", "left");
    }

  } catch (error) {
    console.error("Error:", error);
    append("Error in retrieveing the query.", "left");
  }

  // Backend communication code
});
