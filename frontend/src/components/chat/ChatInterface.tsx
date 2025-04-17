import { Separator } from "../ui/separator";
import { ChatInput } from "./ChatInput";
import { MessageBubble, MessageType } from "./MessageBubble";
import { useState, useRef, useEffect } from "react";
import { queryLLM } from "./queryLLM";

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

    const aiMessage: MessageType = {
      id: Date.now().toString(),
      content: "Generating your query...",
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

  const executeQuery = async (queryMessage: string): Promise<any> => {
    try {
      const response = await fetch("http://127.0.0.1:3000/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: queryMessage }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      console.log("Response from backend:", data);
      return data;
    } catch (error) {
      console.error("Fetch error:", error);
      return { error: String(error) };
    }
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

    const result = await executeQuery(generatedQuery);
    console.log(result);
    return typeof result === "string" ? result : JSON.stringify(result);
  };

  // Simple response generator - would be replaced with actual AI in a real app
  const getAIResponse = (message: string): string => {
    const responses = [
      "I understand you're saying: " + message,
      "That's interesting. Tell me more about " + message,
      "I'm processing your message: " + message,
      "Thank you for sharing that with me.",
      "I'm here to help with any questions you might have.",
      "That's a great point you've raised.",
    ];

    return responses[Math.floor(Math.random() * responses.length)];
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
