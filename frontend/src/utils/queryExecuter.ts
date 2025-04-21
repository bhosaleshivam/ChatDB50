import { stringContainsNoSQL } from "./patternMatcher";


// queryLLM.tsx
const OPENROUTER_API_KEY =
  "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";

const PROMPT_SQL = `You are an expert SQL assistant. 
Convert the following natural language request into a valid logical SQL query using
SELECT, FROM, JOIN, GROUP BY, HAVING, ORDER BY, LIMIT, DELETE, UPDATE. 
Respond with ONLY the SQL query—do NOT include explanations, assumptions, 
formatting like code blocks, or additional text.
If attributes or column names is asked return a query that selects COLUMN_NAME from the information schema of the specified table.
The current database selected is "employees" database. `

const PROMPT_NOSQL = `You are an expert MongoDB assistant. 
Convert the following natural language request into a valid MongoDB query using the appropriate collection methods 
like find, insertOne, updateOne, deleteOne, aggregate, etc.
Respond with ONLY the MongoDB query—do NOT include explanations, assumptions, 
formatting like code blocks, or additional text. The response must start with a valid MongoDB method (db...) `

export const queryLLM = async (naturalQuery: string, cache: object): Promise<string> => {

  const prompt =
    (stringContainsNoSQL(naturalQuery)
      ? PROMPT_NOSQL +
        ". The database has following tables and columns (Make logical queries using this knowledge): "
      : PROMPT_SQL +
        ". The database has following collection names (Make logical queries using this knowledge): ") +
    JSON.stringify(cache) +
    ". Natural language request: " +
    naturalQuery;

  console.log("prompt: ", prompt);

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
          temperature: 0.2,
          seed: Date.now(), // Unique per call
        }),
      }
    );

    console.log("prompt: ", prompt);

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

    return extractedQuery;
  } catch (err) {
    console.error("LLM query error:", err);
    return "Error retrieving query.";
  }
};


export const querySQLExecuter = async (queryMessage: string): Promise<any> => {
    try {
        const response = await fetch("http://127.0.0.1:5000/querySQL", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ query: queryMessage }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Response from backend:", data);
        return { data }; // Explicitly return as object
    } catch (error) {
        console.error("Fetch error:", error);
        return { error: error instanceof Error ? error.message : "Unknown error" };
    }
};

export const queryNoSQLExecuter = async (queryMessage: string): Promise<any> => {
    try {
        const response = await fetch("http://127.0.0.1:5000/queryNoSQL", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ query: queryMessage }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Response from backend:", data);
        return { data }; // Explicitly return as object
    } catch (error) {
        console.error("Fetch error:", error);
        return { error: error instanceof Error ? error.message : "Unknown error" };
    }
};