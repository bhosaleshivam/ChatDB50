
import { cn } from "../../lib/utils";
import { Avatar } from "../ui/avatar";
import { AvatarFallback, AvatarImage } from "../ui/avatar";

export type MessageType = {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
};

interface MessageBubbleProps {
  message: MessageType;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.sender === "user";
  
  return (
    <div
      className={cn(
        "flex w-full animate-message-appear mb-4",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <Avatar className="h-8 w-8 mr-2">
          <AvatarImage src="/placeholder.svg" alt="AI" />
          <AvatarFallback>AI</AvatarFallback>
        </Avatar>
      )}
      
      <div className="flex flex-col max-w-[80%]">
        <div
          className={cn(
            "px-4 py-2 rounded-2xl",
            isUser 
              ? "bg-chat-user-bubble text-chat-user-text rounded-tr-none" 
              : "bg-chat-ai-bubble text-chat-ai-text rounded-tl-none"
          )}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        <span className={cn(
          "text-xs text-chat-timestamp mt-1",
          isUser ? "text-right" : "text-left"
        )}>
          {formatMessageTime(message.timestamp)}
        </span>
      </div>
      
      {isUser && (
        <Avatar className="h-8 w-8 ml-2">
          <AvatarImage src="/placeholder.svg" alt="User" />
          <AvatarFallback>ME</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}

function formatMessageTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  }).format(date);
}
