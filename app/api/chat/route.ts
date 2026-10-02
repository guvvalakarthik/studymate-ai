import { groq } from "@ai-sdk/groq";
import { streamText, tool } from "ai";
import { z } from "zod";
import { retrieveRelevantContext } from "@/app/lib/rag";

const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().optional(),
  image: z.string().optional(),
});

const requestSchema = z.object({
  messages: z.array(chatMessageSchema),
});

type ModelChatMessage =
  | {
      role: "user";
      content: string | Array<{ type: "text"; text: string } | { type: "image"; image: string }>;
    }
  | { role: "assistant"; content: string }
  | { role: "system"; content: string };

function convertMessageToModelMessage(message: {
  role: "user" | "assistant" | "system";
  content?: string;
  image?: string;
}): ModelChatMessage {
  if (message.role === "user" && message.image) {
    return {
      role: "user",
      content: [
        { type: "text", text: message.content || "Explain this image." },
        { type: "image", image: message.image },
      ],
    };
  }

  return {
    role: message.role,
    content: message.content || "",
  };
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "GROQ_API_KEY is not configured. Add it to your environment before using the chatbot.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const body = await req.json();
    const parsed = requestSchema.parse(body);

    const lastUserMessage = [...parsed.messages].reverse().find((msg) => msg.role === "user");
    const context = retrieveRelevantContext(lastUserMessage?.content ?? "general learning support");

    const result = streamText({
      model: groq("llama-3.3-70b-versatile"),
      system: `You are StudyMate AI, a multimodal educational assistant for students.

Guidelines:
- Answer with clear, friendly explanations aimed at learners.
- Use the provided RAG context when relevant.
- If an uploaded image is present, explain the image in educational terms and infer what the diagram, note, or screenshot likely represents.
- Provide step-by-step reasoning for complex topics when useful.
- Keep answers concise but helpful.
- If you are uncertain, say so and suggest how to verify.
- Prefer markdown headings, bullets, and short sections for readability.

Relevant retrieved context:
${context}`,
      messages: parsed.messages.map(convertMessageToModelMessage),
      tools: {
        web_search: tool({
          description: "Search the web for up-to-date facts or references when needed.",
          inputSchema: z.object({
            query: z.string().min(1),
          }),
          execute: async ({ query }) => {
            return {
              query,
              result: "This demo tool is a placeholder for external web retrieval. It can be connected to a real search API in production.",
            };
          },
        }),
      },
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);

    return new Response(
      JSON.stringify({
        error: "Something went wrong while processing your request.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}