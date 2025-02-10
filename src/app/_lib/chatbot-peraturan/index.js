import path from "path";

// Prompts
import { PROMPTS } from "@/config/prompts";

// Model
import { AI_CONFIG } from "@/config/ai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

// Store
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { TaskType } from "@google/generative-ai";

// Generation
import { PromptTemplate } from "@langchain/core/prompts";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { StringOutputParser } from "@langchain/core/output_parsers";

/** @type {import("@langchain/core/runnables").RunnableSequence<Record<string, unknown>, string> | null} */
let chain = null;

const loadVectorStore = async (directory) => {
  try {
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GOOGLE_API_KEY,
      model: AI_CONFIG.gemini.models.embedding,
      taskType: TaskType.SEMANTIC_SIMILARITY,
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
  try {
    const prompt = PromptTemplate.fromTemplate(PROMPTS.chat_template);
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

const initialize = async () => {
  if (chain) {
    return chain;
  }

  const startTime = performance.now();
  try {
    const model = new ChatGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY,
      model: AI_CONFIG.gemini.models.chat,
      temperature: AI_CONFIG.gemini.temperatures.peraturan,
      maxRetries: AI_CONFIG.gemini.retries.peraturan,
    })

    const vectorStore = await loadVectorStore(
      path.join(process.cwd(), AI_CONFIG.vectorStore.paths.peraturan)
    );

    const retriever = createRetriever(vectorStore);
    chain = await createChain(model, retriever);

    const endTime = performance.now();
    console.log(`Initialization took ${(endTime - startTime).toFixed(2)}ms`);

    return chain;
  } catch (error) {
    console.error("Something went wrong while initializing Chatbot", error);
    return null;
  }
};

const ask = async (prompt, { onStream } = {}) => {
  if (!chain) {
    chain = await initialize();
  }

  const startTime = performance.now();

  try {
    if (onStream) {
      const stream = await chain.stream({
        input: prompt,
      });

      let accumulatedText = "";
      let contextData = null;

      for await (const chunk of stream) {
        // console.dir(chunk, { depth: null });
        if (chunk.answer && chunk.answer !== "Text") {
          accumulatedText += chunk.answer;
          await onStream({ text: chunk.answer });
        }

        // Capture context data when available
        if (chunk.context) {
          contextData = chunk.context;
        }
      }

      // Process context after stream completes
      const sourceDocuments = [...new Set(
          contextData?.map((ctx) => {
          // stream.context?.map((ctx) => {
            const filePath = ctx.metadata?.source ?? "";
            const pathSeparator = filePath.includes("/") ? "/" : "\\";
            return filePath.split(pathSeparator).pop();
        }) || []
      )];

      // Send final update with sources
      await onStream({
        text: accumulatedText,
        sourceDocuments,
        done: true
      });

      return { answer: accumulatedText, sourceDocuments };
    } else {
      // Normal mode (existing code)
      const result = await chain.invoke({
        input: prompt,
      });
      const endTime = performance.now();
      console.log(
        `Chain invocation took ${(endTime - startTime).toFixed(2)}ms`
      );

      const sourceDocuments = [...new Set(
        result.context.map((ctx) => {
          const filePath = ctx.metadata?.source ?? "";
          const pathSeparator = filePath.includes("/") ? "/" : "\\";
          return filePath.split(pathSeparator).pop();
        })
      )];

      return {
        ...result,
        sourceDocuments,
      };
    }
  } finally {
    const endTime = performance.now();
    console.log(`Chain invocation took ${(endTime - startTime).toFixed(2)}ms`);
  }
};

export { ask };
