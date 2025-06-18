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
            contents: v.string(),
            type: v.union(v.literal("message"), v.literal("response"), v.literal("system")),
            date: v.string(),
        })),
    }).index("by_chatId", ["chatId"])
});