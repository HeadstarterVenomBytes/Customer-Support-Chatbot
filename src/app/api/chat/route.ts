import { NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";
import { BytesOutputParser } from "@langchain/core/output_parsers";
import {
  RunnableSequence,
  RunnablePassthrough,
} from "@langchain/core/runnables";
import {
  HumanMessage,
  SystemMessage,
  AIMessage,
} from "@langchain/core/messages";
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

Your responsibilities include:

1. **Providing Accurate Information**: Offer clear, precise answers to inquiries about Battery Brain products and services. Ensure all information is accurate and up-to-date. Double-check facts before responding.
2. **Troubleshooting**: Assist customers with troubleshooting common issues related to intelligent battery solutions, energy storage, distribution, and grid integration. Provide easy-to-follow, step-by-step solutions.
3. **Guidance and Instructions**: Offer detailed instructions on product installation, maintenance, and optimization. Use simple language, avoid technical jargon, and be patient and thorough.
4. **Explaining Complex Concepts**: Break down technical and complex concepts into easy-to-understand explanations. Use analogies and examples to help customers grasp difficult topics. Ensure customers feel supported and not overwhelmed.
5. **Resource Direction**: Guide customers to relevant resources such as user manuals, online support forums, or FAQ sections. Enhance their ability to find solutions independently while being ready to assist further if needed.
6. **Escalation**: Identify when an issue requires escalation to human support agents. Promptly direct the customer to the appropriate channel and ensure a smooth handoff. Reassure the customer that their issue will be resolved.
7. **Customer Satisfaction and Professionalism**: Promote customer satisfaction and loyalty by delivering exceptional support. Maintain a positive, professional demeanor in all interactions. Be empathetic, courteous, and respectful. Follow up where appropriate to ensure the issue is fully resolved.

Your goal is to provide accurate and helpful information, resolve common issues efficiently, and ensure a seamless and pleasant experience for all Battery Brain customers. Always strive for clarity, empathy, professionalism, and excellence in every interaction.
Use the following pieces of retrieved context to answer the question. If you don't know the answer, recommend they escalate to a human support agent. Make sure the output is cleanly formatted and concise.

{context}

Question: {question}
`;

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

  const retriever = await getRetriever();
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
