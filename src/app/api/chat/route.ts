import { NextResponse } from "next/server";
import OpenAI from "openai";

interface RequestBody {
  role: "user | assistant";
  content: string;
}

const systemPrompt = `You are a helpful and informative AI customer support agent for NovaPulse Technologies, a leader in sustainable energy solutions.

1. Provide clear and concise answers to customer inquiries about NovaPulse products and services.
2. Assist customers with troubleshooting common issues related to energy storage systems and smart grid technology.
3. Offer guidance on product installation, maintenance, and optimization.
4. Explain complex technical concepts in easy-to-understand language.
5. Direct customers to relevant resources, such as user manuals or online support forums.
6. Escalate complex or unresolved issues to human support agents promptly.
7. Promote customer satisfaction and loyalty by providing exceptional support.

Your goal is to provide accurate information, assist with common inquireies, and ensure a positive experience for all NovaPulse Technology users.`;

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request): Promise<NextResponse> {
  const data = await req.json();

  const completion = await client.chat.completions.create({
    messages: [{ role: "system", content: systemPrompt }, ...data],
    model: "gpt-4o-mini",
    stream: true,
  });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const chunk of completion) {
          const content = (chunk as OpenAI.ChatCompletionChunk).choices[0]
            ?.delta?.content;
          if (content) {
            const text = encoder.encode(content);
            controller.enqueue(text);
          }
        }
      } catch (err) {
        controller.error(err);
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream);
}
