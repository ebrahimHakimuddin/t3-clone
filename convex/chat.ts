
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";


export const makeNewChat = mutation({
    args: {
        chatId: v.string(),
        chatName: v.string(),
        chatHistory: v.array(v.object({
            contents: v.string(),
            type: v.union(v.literal("message"), v.literal("response")),
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
            if (!(updatedBody[updatedBody.length - 1].type === "response")) {
                updatedBody.push({
                    contents: "",
                    date: date,
                    type: "response"
                })
            }
            for (let i = updatedBody.length - 1; i >= 0; i--) {
                if (updatedBody[i].type === "response") {
                    // Update the contents of the most recent response
                    updatedBody[i] = {
                        ...updatedBody[i],
                        contents: updatedBody[i].contents + args.delta
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
                contents: args.message,
                type: "message" as const,
                date: new Date().toISOString()
            };

            const updatedBody = [...chatHistory.body, newMessage];

            await ctx.db.patch(chatHistory._id, {
                body: updatedBody
            });

            return "Message added successfully";
        } catch (e) {
            return ""
        }
    }
})