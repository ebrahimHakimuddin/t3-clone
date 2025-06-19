"use client";
import { Textarea } from "@/components/ui/textarea";
import { MoveUp, ArrowDown, Loader2, Copy, Check } from "lucide-react";
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
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";

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
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedStates, setCopiedStates] = useState<{ [key: number]: boolean }>(
    {}
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatData.body]);

  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStates((prev) => ({ ...prev, [index]: true }));
      setTimeout(() => {
        setCopiedStates((prev) => ({ ...prev, [index]: false }));
      }, 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  // Clean markdown components
  const markdownComponents = {
    /* eslint-disable  @typescript-eslint/no-explicit-any */
    code({ inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || "");
      const codeString = String(children).replace(/\n$/, "");

      return !inline && match ? (
        <div className="relative group my-4">
          <div className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-t-lg border border-gray-200 border-b-0">
            <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              {match[1]}
            </span>
            <button
              onClick={() => navigator.clipboard.writeText(codeString)}
              className="opacity-0 group-hover:opacity-100 transition-opacity bg-white hover:bg-gray-100 p-1 rounded text-gray-600 hover:text-gray-800 border border-gray-200"
              title="Copy code"
            >
              <Copy className="h-3 w-3" />
            </button>
          </div>
          <SyntaxHighlighter
            style={oneLight}
            language={match[1]}
            PreTag="div"
            className="rounded-b-lg"
            customStyle={{
              margin: 0,
              borderRadius: "0 0 0.5rem 0.5rem",
              backgroundColor: "#fafafa",
              border: "1px solid #e5e7eb",
              borderTop: "none",
              fontSize: "0.875rem",
              lineHeight: "1.6",
              padding: "1rem",
            }}
            {...props}
          >
            {codeString}
          </SyntaxHighlighter>
        </div>
      ) : (
        <code
          className="bg-gray-100 border border-gray-200 px-2 py-1 rounded text-sm font-mono text-gray-800"
          {...props}
        >
          {children}
        </code>
      );
    },
    blockquote({ children }: any) {
      return (
        <div className="my-4 border-l-4 border-blue-400 bg-blue-50 rounded-r-lg">
          <blockquote className="pl-4 py-3 text-blue-900 italic">
            {children}
          </blockquote>
        </div>
      );
    },
    h1({ children }: any) {
      return (
        <h1 className="text-2xl font-bold mb-4 mt-6 text-gray-900 border-b-2 border-gray-200 pb-2">
          {children}
        </h1>
      );
    },
    h2({ children }: any) {
      return (
        <h2 className="text-xl font-semibold mb-3 mt-5 text-gray-800">
          {children}
        </h2>
      );
    },
    h3({ children }: any) {
      return (
        <h3 className="text-lg font-medium mb-2 mt-4 text-gray-800">
          {children}
        </h3>
      );
    },
    ul({ children }: any) {
      return <ul className="mb-4 space-y-1 text-gray-700 ml-4">{children}</ul>;
    },
    ol({ children }: any) {
      return <ol className="mb-4 space-y-1 text-gray-700 ml-4">{children}</ol>;
    },
    li({ children }: any) {
      return <li className="leading-relaxed list-disc">{children}</li>;
    },
    p({ children }: any) {
      return <p className="mb-4 leading-7 text-gray-800">{children}</p>;
    },
    a({ href, children }: any) {
      return (
        <a
          href={href}
          className="text-blue-600 hover:text-blue-800 underline decoration-blue-300 hover:decoration-blue-500 transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          {children}
        </a>
      );
    },
    strong({ children }: any) {
      return (
        <strong className="font-semibold text-gray-900">{children}</strong>
      );
    },
    em({ children }: any) {
      return <em className="italic text-gray-600">{children}</em>;
    },
  };

  const handleSendMessage = async () => {
    if (message.trim() === "" || params.chatId === "" || isGenerating) return;

    const currentMessage = message.trim();
    setMessage("");
    setIsGenerating(true);

    try {
      await newMessage({
        chatId: params.chatId,
        message: currentMessage,
      });

      const { output } = await generate(currentMessage);

      for await (const delta of readStreamableValue(output)) {
        if (delta) {
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
          {chatData.body.map((chat, index) => (
            <div
              key={index}
              className={`flex ${
                chat.type === "message" ? "justify-end" : "justify-start"
              } animate-in slide-in-from-bottom-2 duration-300`}
            >
              <div
                className={`max-w-[85%] md:max-w-[90%] p-4 mb-4 rounded-lg transition-all duration-200 relative group ${
                  chat.type === "message"
                    ? "bg-gradient-to-br from-[#F4DAEE] to-[#E8C6D9] ml-auto shadow-sm"
                    : "bg-white shadow-md border border-gray-200 mr-auto hover:shadow-lg"
                }`}
              >
                <div className="relative prose prose-sm max-w-none">
                  <Markdown
                    components={markdownComponents}
                    remarkPlugins={[remarkGfm]}
                  >
                    {chat.contents}
                  </Markdown>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs opacity-70">
                    {new Date(chat.date).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {chat.type === "response" && (
                    <button
                      onClick={() => handleCopy(chat.contents, index)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity bg-gray-100 hover:bg-gray-200 p-1.5 rounded text-gray-600 hover:text-gray-800"
                      title="Copy message"
                    >
                      {copiedStates[index] ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        <div className="absolute rounded-lg bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border/20 supports-[backdrop-filter]:bg-background/60 shadow-lg">
          <div className="w-full p-4 flex flex-col space-y-3">
            <div className="w-full relative">
              <Textarea
                placeholder="Type your message... (Shift + Enter for new line)"
                className="min-h-[60px] max-h-32 resize-none border-2 border-border/50 focus:border-primary/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-200 pr-12"
                rows={1}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isGenerating}
              />
              <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                {message.length > 0 && `${message.length}/2000`}
              </div>
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
