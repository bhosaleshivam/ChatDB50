import { Separator } from "../ui/separator";
import { ChatInput } from "./ChatInput";
import { MessageBubble, MessageType } from "./MessageBubble";
import { useState, useRef, useEffect } from "react";
import { stringContainsSQL, stringContainsNoSQL } from "../../utils/patternMatcher";
import { querySQLExecuter, queryLLM, queryNoSQLExecuter } from "../../utils/queryExecuter";
import { jsonToTableString } from "../../utils/jsonToTableString";

const initialMessages: MessageType[] = [
  {
    id: "1",
    content: "Hello! How can I help you today?",
    sender: "ai",
    timestamp: new Date(Date.now() - 60000),
  },
];

export function ChatInterface() {
  const [messages, setMessages] = useState<MessageType[]>(initialMessages);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMessage: MessageType = {
      id: Date.now().toString(),
      content,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    // Contains both sql & nosql in input
    if (stringContainsSQL(content) && stringContainsNoSQL(content)) {
      const aiMessage: MessageType = {
        id: Date.now().toString(),
        content: "I can perform operations on MongoDB/NoSQL or MySQL/SQL one at a time :). Let me know which one do you want to go first",
        sender: "ai",
        timestamp: new Date(),
      };
    
      setMessages((prev) => [...prev, aiMessage]);
      setLoading(false);
      return; // Colon removed
    }

    // Contains no keyword sql or nosql in input
    if (!(stringContainsSQL(content) || stringContainsNoSQL(content))) {
      const aiMessage: MessageType = {
        id: Date.now().toString(),
        content: "We have a MongoDB database and a MySQL database. Please explicitly mention MongoDB/NoSQL or MySQL/SQL to perform any operations :)",
        sender: "ai",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      setLoading(false);
      return;
    };

    const aiMessage: MessageType = {
      id: Date.now().toString(),
      content: "Working on your query...",
      sender: "ai",
      timestamp: new Date(),
    };

    setTimeout(async () => {
      setMessages((prev) => [...prev, aiMessage]);
    }, 1000);

    // Simulate AI response after a delay
    setTimeout(async () => {
      const aiContent = await handleQuery(content); // getAIResponse(content)
      const aiMessage: MessageType = {
        id: (Date.now() + 1).toString(),
        content: aiContent,
        sender: "ai",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      setLoading(false);
    }, 3000);
  };

  const handleQuery = async (queryMessage: string): Promise<string> => {
    const generatedQuery = await queryLLM(queryMessage);

    const aiMessage: MessageType = {
      id: Date.now().toString(),
      content: generatedQuery,
      sender: "ai",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, aiMessage]);

    let result;
    if (stringContainsSQL(queryMessage)) {
      result = await querySQLExecuter(generatedQuery);
      return jsonToTableString(result.data);
    } else {
      result = await queryNoSQLExecuter(generatedQuery);
      return JSON.stringify(result);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden rounded-md border shadow-sm bg-white">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Chat Assistant</h2>
        <span className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString()}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {loading && (
          <div className="flex justify-start mb-4 animate-pulse">
            <div className="bg-chat-ai-bubble px-4 py-2 rounded-2xl rounded-tl-none">
              <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <Separator />
      <ChatInput onSendMessage={handleSendMessage} disabled={loading} />
    </div>
  );
}
