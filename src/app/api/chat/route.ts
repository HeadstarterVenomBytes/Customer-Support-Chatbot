import { NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";
import { BytesOutputParser } from "@langchain/core/output_parsers";
import {
  RunnableSequence,
  RunnablePassthrough,
} from "@langchain/core/runnables";

import { PromptTemplate } from "@langchain/core/prompts";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { getRetriever } from "@/lib/loadDocuments";

interface UserMessage {
  role: "user";
  content: string;
}

interface AssistantMessage {
  role: "assistant";
  content: string;
}

type RequestBody = UserMessage | AssistantMessage;

const template = `You are a knowledgeable and supportive AI customer support agent for Battery Brain, a company dedicated to reshaping the energy industry by merging cutting-edge AI with proven engineering.

Your goal is to provide accurate and helpful information, resolve common issues efficiently, and ensure a seamless and pleasant experience for all Battery Brain customers. Always strive for clarity, empathy, professionalism, and excellence in every interaction.

Use the following pieces of retrieved context to answer the question:
{context}

If the context doesn't contain relevant information to answer the question, clearly state that. If you're unsure or the answer requires information beyond what's provided, recommend escalation to a human support agent.

Make sure your response is cleanly formatted, concise, and directly addresses the user's question. If appropriate, provide step-by-step instructions or bullet points for clarity.

Question: {question}

Helpful answer:`;

const customPrompt = PromptTemplate.fromTemplate(template);

const llm = new ChatOpenAI({
  modelName: "meta-llama/llama-3.1-8b-instruct:free",
  streaming: true,
  openAIApiKey: process.env.OPENROUTER_API_KEY!,
  configuration: {
    baseURL: "https://openrouter.ai/api/v1",
  },
});

// Only initialize the chain once
let chain: RunnableSequence<Record<string, unknown>, Uint8Array> | null = null;

async function initChain() {
  chain = await createStuffDocumentsChain({
    llm,
    prompt: customPrompt,
    outputParser: new BytesOutputParser(),
  });
}

// Ensure the chain is initialized before handling requests
initChain().catch((err) => {
  console.error("Failed to initialize chain", err);
});

export async function POST(req: Request): Promise<NextResponse> {
  const retriever = await getRetriever();

  if (!chain) {
    return NextResponse.json(
      { error: "Chain not initialized" },
      { status: 500 }
    );
  }

  const data = await req.json();
  const question = data.find(
    (msg: RequestBody) => msg.role === "user"
  )?.content;

  const context = await retriever.invoke(question);

  const completion = await chain.stream({
    question,
    context,
  });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of completion) {
          if (chunk) {
            controller.enqueue(chunk);
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
