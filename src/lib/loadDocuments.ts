import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { JSONLoader } from "langchain/document_loaders/fs/json";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import path from "path";

const embeddings = new HuggingFaceInferenceEmbeddings({
  apiKey: process.env.HUGGINGFACEHUB_API_KEY!,
  model: "sentence-transformers/multi-qa-mpnet-base-dot-v1",
});

export async function getRetriever() {
  const dataDirectory = path.join(process.cwd(), "data/");

  const loader = new DirectoryLoader(dataDirectory, {
    ".json": (path: string) => new JSONLoader(path),
  });

  const docs = await loader.load();

  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const allSplits = await textSplitter.splitDocuments(docs);

  const vectorStore = await MemoryVectorStore.fromDocuments(
    allSplits,
    embeddings
  );

  const retriever = vectorStore.asRetriever({
    k: 8,
    searchType: "similarity",
  });

  return retriever;
}
