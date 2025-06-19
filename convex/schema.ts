import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    chats: defineTable({
        chatId: v.string(),
        chatName: v.string(),
        authorId: v.string(),
    }).index("by_authorId", ["authorId"]).index("by_authorId_chatId", ["authorId", "chatId"]),
    chatHistory: defineTable({
        chatId: v.id("chats"),
        body: v.array(v.object({
            content: v.string(),
            role: v.union(v.literal("user"), v.literal("assistant")),
            date: v.string(),
        })),
    }).index("by_chatId", ["chatId"])
});