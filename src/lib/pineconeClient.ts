import { Pinecone } from "@pinecone-database/pinecone";
import { BasePineconeError } from "@pinecone-database/pinecone/dist/errors";

export async function initPinecone() {
  try {
    const pc = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
    const index = pc.index("batterybrain-knowledge-base");
    return index;
  } catch (error) {
    if (error instanceof BasePineconeError) {
      console.error("Pinecone error:", error.message);
    } else {
      console.error("Unexpected error:", error);
    }
    throw error;
  }
}
