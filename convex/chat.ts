
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";


export const makeNewChat = mutation({
    args: {
        chatId: v.string(),
        chatName: v.string(),
        chatHistory: v.array(v.object({
            content: v.string(),
            role: v.union(v.literal("user"), v.literal("assistant")),
            date: v.string(),
        })),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (identity === null) return
        const chatId = await ctx.db.insert("chats", {
            chatId: args.chatId,
            chatName: args.chatName,
            authorId: identity.tokenIdentifier
        });
        if (!chatId) return
        const chatHistoryId = await ctx.db.insert("chatHistory", {
            chatId: chatId,
            body: args.chatHistory
        })
        return chatHistoryId
    },
});

export const getUserChats = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (identity === null) return
        try {
            const chats = await ctx.db.query("chats").withIndex("by_authorId", (q) => q.eq("authorId", identity.tokenIdentifier)).collect()
            return chats
        } catch (e) {
            return []
        }
    }
})

export const getChatHistory = query({
    args: { chatId: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (identity === null) return
        try {
            const [{ _id: chatIdFromDB }] = await ctx.db.query("chats").withIndex("by_authorId_chatId", (q) => q.eq("authorId", identity.tokenIdentifier).eq("chatId", args.chatId)).collect()
            const [chatHistory] = await ctx.db.query("chatHistory").withIndex("by_chatId", (q) => q.eq("chatId", chatIdFromDB)).collect()
            return chatHistory
        } catch (e) {
            return { body: [] }
        }
    }
})

export const updateChatResponse = mutation({
    args: { chatId: v.string(), delta: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (identity === null) return

        try {
            const [{ _id: chatIdFromDB }] = await ctx.db.query("chats").withIndex("by_authorId_chatId", (q) => q.eq("authorId", identity.tokenIdentifier).eq("chatId", args.chatId)).collect()
            const [chatHistory] = await ctx.db.query("chatHistory").withIndex("by_chatId", (q) => q.eq("chatId", chatIdFromDB)).collect()

            if (!chatHistory) return
            const updatedBody = [...chatHistory.body];
            const date = new Date().toISOString()
            if (!(updatedBody[updatedBody.length - 1].role === "assistant")) {
                updatedBody.push({
                    content: "",
                    date: date,
                    role: "assistant"
                })
            }
            for (let i = updatedBody.length - 1; i >= 0; i--) {
                if (updatedBody[i].role === "assistant") {
                    // Update the contentscontents of the most recent response
                    updatedBody[i] = {
                        ...updatedBody[i],
                        content: updatedBody[i].content + args.delta
                    };
                    break;
                }
            }
            await ctx.db.patch(chatHistory._id, {
                body: updatedBody
            });

            return "Updated successfully";
        } catch (e) {
            return ""
        }
    }
})

export const updateChatMessage = mutation({
    args: { chatId: v.string(), message: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (identity === null) return

        try {
            const [{ _id: chatIdFromDB }] = await ctx.db.query("chats").withIndex("by_authorId_chatId", (q) => q.eq("authorId", identity.tokenIdentifier).eq("chatId", args.chatId)).collect()
            const [chatHistory] = await ctx.db.query("chatHistory").withIndex("by_chatId", (q) => q.eq("chatId", chatIdFromDB)).collect()

            if (!chatHistory) return

            const newMessage = {
                content: args.message,
                role: "user" as const,
                date: new Date().toISOString()
            };

            const updatedBody = [...chatHistory.body, newMessage];

            await ctx.db.patch(chatHistory._id, {
                body: updatedBody
            });

            return ctx.db.get(chatHistory._id);
        } catch (e) {
            return ""
        }
    }
})