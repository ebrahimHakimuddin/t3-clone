'use server';

import { generateText, streamText } from 'ai';
import { createStreamableValue } from 'ai/rsc';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_API_KEY })

export async function generate(messages: Array<{
    role: "user" | "assistant",
    content: string,
    date: string
}>, model: string
) {
    const stream = createStreamableValue('');

    (async () => {
        const { textStream } = streamText({
            model: google(model),
            messages: messages
        });

        for await (const delta of textStream) {
            stream.update(delta);
        }

        stream.done();
    })();

    return { output: stream.value };
}

export async function generateChatName(firstMessage: string): Promise<string> {
    try {
        const { text } = await generateText({
            model: google('gemini-2.0-flash-exp'),
            prompt: `Generate a short, descriptive title (3-6 words) for a chat conversation that starts with this message: "${firstMessage}". 
      
      The title should:
      - Be concise and clear
      - Capture the main topic or intent
      - Not use quotes or special characters
      - Be suitable as a chat thread title
      
      Examples:
      - "How to learn React" for a message about React learning
      - "Recipe for chocolate cake" for a cooking question
      - "Travel tips for Japan" for travel advice
      
      Only respond with the title, nothing else.`,
            maxTokens: 20,
            temperature: 0.3,
        });

        return text.trim() || "New Chat";
    } catch (error) {
        console.error('Error generating chat name:', error);
        return "New Chat";
    }
}