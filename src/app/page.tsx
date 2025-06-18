"use client";
import { Textarea } from "@/components/ui/textarea";
import { MoveUp, ArrowDown, Loader2 } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { useConvexAuth, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useRouter } from "next/navigation";

import { readStreamableValue } from "ai/rsc";
import { generate, generateChatName } from "@/models/models";

// Define available models
const AVAILABLE_MODELS = [
  { id: "gemini-2.5-flash", name: "Gemini - 2.5 Flash" },
];

export default function Chat() {
  const { isAuthenticated } = useConvexAuth();
  const [message, setMessage] = useState("");
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const makeNewChat = useMutation(api.chat.makeNewChat);
  const updateChat = useMutation(api.chat.updateChatResponse);
  const router = useRouter();
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0]); // Default to Gemini 2.5 Flash
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const handleStartChat = async () => {
    if (message.trim() === "" || isCreatingChat || !isAuthenticated) return;

    const currentMessage = message.trim();
    setIsCreatingChat(true);

    try {
      const id = crypto.randomUUID();
      const name = await generateChatName(currentMessage);

      makeNewChat({
        chatId: id,
        chatHistory: [
          {
            contents: currentMessage,
            type: "message",
            date: new Date().toISOString(),
          },
        ],
        chatName: name,
      });

      const { output } = await generate(currentMessage);

      for await (const delta of readStreamableValue(output)) {
        updateChat({
          chatId: id,
          delta: delta || "",
        });
      }

      router.push("/chat/" + id);
    } catch (error) {
      console.error("Error creating chat:", error);
      setIsCreatingChat(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleStartChat();
    }
  };

  return (
    <div className="flex justify-center w-full h-full relative">
      <div className="w-full max-w-3xl flex flex-col h-screen relative">
        {/* Welcome section with centered content */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center space-y-4 max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2">
              Welcome to AI Chat
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8">
              Start a conversation with AI. Ask questions, get insights, or just
              chat!
            </p>
            {!isAuthenticated && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-yellow-800">
                  Please sign in to start chatting with AI
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Input section at bottom */}
        <div className="absolute rounded-lg bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border/20 supports-[backdrop-filter]:bg-background/60 shadow-lg">
          <div className="w-full p-4 flex flex-col space-y-3">
            <div className="w-full">
              <Textarea
                ref={textareaRef}
                placeholder={
                  isAuthenticated
                    ? "Type your message to start a new chat..."
                    : "Please sign in to start chatting"
                }
                className="min-h-[60px] max-h-32 resize-none border-2 border-border/50 focus:border-primary/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-200"
                rows={1}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isCreatingChat || !isAuthenticated}
              />
            </div>
            <div className="flex flex-row justify-between items-center gap-3">
              <SidebarTrigger className="h-10 w-10 md:hidden border border-[#A5406D] hover:bg-[#E8C6D9] transition-colors flex-shrink-0" />

              <DropdownMenu>
                <DropdownMenuTrigger
                  disabled={isCreatingChat || !isAuthenticated}
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
                onClick={handleStartChat}
                disabled={
                  isCreatingChat || message.trim() === "" || !isAuthenticated
                }
                className="bg-[#A5406D] hover:bg-[#8B3059] disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg h-10 w-10 flex items-center justify-center transition-colors flex-shrink-0"
              >
                {isCreatingChat ? (
                  <Loader2 className="h-4 w-4 text-white animate-spin" />
                ) : (
                  <MoveUp className="h-4 w-4 text-[#F4DAEE]" />
                )}
              </Button>
            </div>

            {isCreatingChat && (
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Creating your chat...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
