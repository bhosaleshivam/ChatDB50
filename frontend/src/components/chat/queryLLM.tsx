// queryLLM.tsx
const OPENROUTER_API_KEY =
  "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";

const PROMPT_SQL = `You are an expert SQL assistant. 
Convert the following natural language request into a valid SQL query. 
Respond with ONLY the SQL query—do NOT include explanations, assumptions, 
formatting like code blocks, or additional text. The response must start with a valid SQL 
keyword like SELECT, INSERT, UPDATE, DELETE, etc. Natural language request: `


'You are an expert SQL assistant. Convert the following natural language request into a valid SQL query. Respond with ONLY the SQL query—do NOT include explanations, assumptions, formatting like code blocks, or additional text. The response must start with a valid SQL keyword like SELECT, INSERT, UPDATE, DELETE, etc. Natural language request: "${naturalQuery}"'

export const queryLLM = async (naturalQuery: string): Promise<string> => {
  // Infer DB type from query
  console.log("naturalQuery: ", naturalQuery);
  let dbType = "SQL";
  const lowerQuery = naturalQuery.toLowerCase();
  if (lowerQuery.includes("nosql") || lowerQuery.includes("mongodb")) {
    dbType = "NoSQL";
  } else if (lowerQuery.includes("sql") || lowerQuery.includes("rdbms")) {
    dbType = "SQL";
  }

  const prompt =
    dbType === "NoSQL"
      ? `Convert the following request into a MongoDB query using db.collection.find(...) format. Only return the query. Do not include connection, setup, or Python code.\n"${naturalQuery}"`
      : PROMPT_SQL + naturalQuery;

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": "http://localhost",
          "X-Title": "ChatDB50",
        },
        body: JSON.stringify({
          model: "mistralai/mistral-7b-instruct",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      }
    );

    console.log("response: ", response);

    const data = await response.json();
    const fullResponse = data?.choices?.[0]?.message?.content?.trim();

    if (!fullResponse) {
      throw new Error("Invalid response from LLM");
    }

    // Extract clean query
    const extractedQuery =
      fullResponse.match(/```(?:[a-z]+)?\s*([\s\S]*?)```/i)?.[1]?.trim() ||
      fullResponse
        .split("\n")
        .filter(
          (line: string) =>
            line.toLowerCase().startsWith("select") ||
            line.toLowerCase().startsWith("from") ||
            line.toLowerCase().startsWith("join") ||
            line.trim().startsWith("db.") ||
            line.includes(".find(")
        )
        .join("\n")
        .trim() ||
      fullResponse;

    console.log("extractedQuery: ", extractedQuery)
    return extractedQuery;
  } catch (err) {
    console.error("LLM query error:", err);
    return "Error retrieving query.";
  }
};
