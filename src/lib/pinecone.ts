import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";

const pinecone = new PineconeClient({
  apiKey: process.env.PINECONE_API_KEY!,
});

export const getPineconeIndex = (indexName: string) => {
  return pinecone.Index(indexName);
};
