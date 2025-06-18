"use client";
import { Textarea } from "@/components/ui/textarea";
import { MoveUp, ArrowDown, Loader2 } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import Markdown from "react-markdown";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { generate } from "@/models/models";
import { readStreamableValue } from "ai/rsc";
import { useState, useRef, useEffect } from "react";

// Define available models
const AVAILABLE_MODELS = [
  { id: "gemini-2.5-flash", name: "Gemini - 2.5 Flash" },
];

export default function Chat() {
  const params = useParams<{ chatId: string }>();
  const updateChat = useMutation(api.chat.updateChatResponse);
  const newMessage = useMutation(api.chat.updateChatMessage);
  const chatData = useQuery(api.chat.getChatHistory, {
    chatId: params.chatId || "",
  }) ?? { body: [] };

  const [message, setMessage] = useState("");
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0]); // Default to Gemini 2.5 Flash
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatData.body, streamingMessage]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        128
      )}px`;
    }
  }, [message]);

  const handleSendMessage = async () => {
    if (message.trim() === "" || params.chatId === "" || isGenerating) return;

    const currentMessage = message.trim();
    setMessage("");
    setIsGenerating(true);
    setStreamingMessage("");

    try {
      // Add user message to chat
      await newMessage({
        chatId: params.chatId,
        message: currentMessage,
      });

      // Generate AI response with streaming
      const { output } = await generate(currentMessage);
      let accumulatedResponse = "";

      for await (const delta of readStreamableValue(output)) {
        if (delta) {
          accumulatedResponse += delta;
          setStreamingMessage(accumulatedResponse);

          // Update the chat with the accumulated response
          updateChat({
            chatId: params.chatId,
            delta: delta,
          });
        }
      }
    } catch (error) {
      console.error("Error generating response:", error);
    } finally {
      setIsGenerating(false);
      setStreamingMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  return (
    <div className="flex justify-center w-full h-full relative">
      <div className="w-full max-w-3xl flex flex-col h-screen relative">
        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32">
          {chatData!.body.map((chat, index) => (
            <div
              key={index}
              className={`flex ${
                chat.type === "message" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] md:max-w-[80%] p-3 rounded-lg transition-all duration-200 ${
                  chat.type === "message"
                    ? "bg-[#F4DAEE] ml-auto"
                    : "bg-white shadow-sm border border-gray-200 mr-auto"
                }`}
              >
                <div className="max-w-none prose prose-sm">
                  <Markdown>{chat.contents.toString()}</Markdown>
                </div>
                <span className="text-xs opacity-70 mt-2 block">
                  {new Date(chat.date).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          ))}

          {/* Show streaming message */}
          {isGenerating && streamingMessage && (
            <div className="flex justify-start">
              <div className="max-w-[85%] md:max-w-[80%] p-3 rounded-lg bg-white shadow-sm border border-gray-200 mr-auto">
                <div className="max-w-none prose prose-sm">
                  <Markdown>{streamingMessage}</Markdown>
                </div>
                <div className="flex items-center space-x-1 mt-2">
                  <Loader2 className="h-3 w-3 animate-spin opacity-70" />
                  <span className="text-xs opacity-70">Generating...</span>
                </div>
              </div>
            </div>
          )}

          {/* Show typing indicator when starting generation */}
          {isGenerating && !streamingMessage && (
            <div className="flex justify-start">
              <div className="max-w-[85%] md:max-w-[80%] p-3 rounded-lg bg-white shadow-sm border border-gray-200 mr-auto">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                  <span className="text-xs opacity-70">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="absolute rounded-lg bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border/20 supports-[backdrop-filter]:bg-background/60 shadow-lg">
          <div className="w-full p-4 flex flex-col space-y-3">
            <div className="w-full">
              <Textarea
                ref={textareaRef}
                placeholder="Type your message..."
                className="min-h-[60px] max-h-32 resize-none border-2 border-border/50 focus:border-primary/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-200"
                rows={1}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isGenerating}
              />
            </div>
            <div className="flex flex-row justify-between items-center gap-3">
              <SidebarTrigger className="h-10 w-10 md:hidden border border-[#A5406D] hover:bg-[#E8C6D9] transition-colors flex-shrink-0" />

              <DropdownMenu>
                <DropdownMenuTrigger
                  disabled={isGenerating}
                  className="flex-1 md:flex-initial"
                >
                  <div className="flex items-center justify-center space-x-2 border border-[#A5406D] rounded-lg h-10 px-3 hover:bg-[#E8C6D9] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-w-0">
                    <span className="truncate">{selectedModel.name}</span>
                    <ArrowDown className="h-4 w-4 flex-shrink-0" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border border-border/50">
                  {AVAILABLE_MODELS.map((model) => (
                    <DropdownMenuItem
                      key={model.id}
                      className="cursor-pointer hover:bg-[#E8C6D9]/50"
                      onClick={() => setSelectedModel(model)}
                    >
                      {model.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                onClick={handleSendMessage}
                disabled={isGenerating || message.trim() === ""}
                className="bg-[#A5406D] hover:bg-[#8B3059] disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg h-10 w-10 flex items-center justify-center transition-colors flex-shrink-0"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 text-white animate-spin" />
                ) : (
                  <MoveUp className="h-4 w-4 text-[#F4DAEE]" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
