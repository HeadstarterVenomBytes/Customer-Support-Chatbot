import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { JSONLoader } from "langchain/document_loaders/fs/json";
import { PineconeStore } from "@langchain/pinecone";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { getPineconeIndex } from "@/lib/pinecone";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import path from "path";

const embeddings = new HuggingFaceInferenceEmbeddings({
  apiKey: process.env.HUGGINGFACEHUB_API_KEY!,
  model: "sentence-transformers/multi-qa-mpnet-base-dot-v1",
});

export async function uploadToPinecone() {
  const pineconeIndex = getPineconeIndex(process.env.PINECONE_INDEX!);

  const dataDirectory = path.join(process.cwd(), "data/");

  const loader = new DirectoryLoader(dataDirectory, {
    ".json": (path: string) => new JSONLoader(path),
  });

  const docs = await loader.load();

  // TODO: custom json splitting for better metadata ?
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const allSplits = await textSplitter.splitDocuments(docs);

  await PineconeStore.fromDocuments(allSplits, embeddings, {
    pineconeIndex: pineconeIndex,
    textKey: "text",
  });
}

export async function getRetriever() {
  const pineconeIndex = getPineconeIndex(process.env.PINECONE_INDEX!);

  const indexStats = await pineconeIndex.describeIndexStats();
  const vectorCount = indexStats.totalRecordCount;

  // TODO: find better way to ensure all documents are uploaded
  if (vectorCount === 0) {
    console.log("No documents found in Pinecone. Uploading documents...");
    await uploadToPinecone();
  } else {
    console.log("Documents already exist in Pinecone. No upload needed.");
  }

  const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex: pineconeIndex,
    textKey: "text",
  });

  return vectorStore.asRetriever({
    k: 10,
    searchType: "similarity",
  });
}
