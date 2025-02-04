import path from "path";

// Model
import { AI_CONFIG } from "@/config/ai";
import { ChatOpenAI } from "@langchain/openai";

// Store
import { OpenAIEmbeddings } from "@langchain/openai";
import { FaissStore } from "@langchain/community/vectorstores/faiss";

// Generation
import { PromptTemplate } from "@langchain/core/prompts";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { StringOutputParser } from "@langchain/core/output_parsers";

const loadVectorStore = async (directory) => {
  try {
    const embeddings = new OpenAIEmbeddings({
      apiKey: process.env.OPENAI_API_KEY,
      model: AI_CONFIG.openai.models.embedding,
    });

    return await FaissStore.load(directory, embeddings);
  } catch (error) {
    throw new Error("Error while loading vector store!", { cause: error });
  }
};

const createRetriever = (vectorStore) => {
  try {
    return vectorStore.asRetriever({
      k: 4,
      searchType: "similarity",
    });
  } catch (error) {
    throw new Error("Error while creating retriever!", { cause: error });
  }
};

const createChain = async (model, retriever) => {
  const promptTemplate = `
  Anda adalah seorang asisten yang dapat membantu menjawab pertanyaan user secara lengkap dan detail, jawablah pertanyaan user dengan bahasa indonesia.

  Konteks: {context}
  Pertanyaan: {input}
  Jawaban:
  `;

  try {
    const prompt = PromptTemplate.fromTemplate(promptTemplate);
    const chain = await createStuffDocumentsChain({
      llm: model,
      prompt,
      outputParser: new StringOutputParser(),
    });

    return await createRetrievalChain({
      combineDocsChain: chain,
      retriever,
    });
  } catch (error) {
    throw new Error("Error while creating retrieval chain!", { cause: error });
  }
};

const ask = async (prompt) => {
  const chain = await initialize();
  if (!chain) {
    return {
      answer:
        "Maaf, saat ini saya tidak dapat menjawab pertanyaan Anda. Silakan coba beberapa saat lagi.",
    };
  }

  const result = await chain.invoke({
    input: prompt,
  });

  const sourceDocuments = result.context.map((ctx) => {
    const filePath = ctx.metadata?.source ?? "";
    const pathSeparator = filePath.includes("/") ? "/" : "\\";
    return filePath.split(pathSeparator).pop();
  });

  return {
    ...result,
    sourceDocuments,
  };
};

const initialize = async () => {
  try {
    const model = new ChatOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      model: AI_CONFIG.openai.models.chat,
      temperature: AI_CONFIG.openai.temperatures.pengetahuan,
      maxRetries: AI_CONFIG.openai.retries.pengetahuan,
    })

    const vectorStore = await loadVectorStore(
      path.join(
        process.cwd(),
        AI_CONFIG.vectorStore.paths.pengetahuan
      )
    );

    const retriever = createRetriever(vectorStore);
    const chain = await createChain(model, retriever);

    return (retriever && chain) || null;
  } catch (error) {
    console.error("Something went wrong while initializing Chatbot", error);
    return null;
  }
};

export { ask };