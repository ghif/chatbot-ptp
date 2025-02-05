import dotenv from "dotenv";

import path from "path";
import fs from "fs/promises";

import { AI_CONFIG } from "@/config/ai";

import { FaissStore } from "@langchain/community/vectorstores/faiss";

// Document Loader
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

// Text Splitter
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

// Store
// import { OpenAIEmbeddings } from "@langchain/openai";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { TaskType } from "@google/generative-ai";


// dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const loadPdfDocuments = async (path) => {
  try {
    const directoryLoader = new DirectoryLoader(path, {
      ".pdf": (filePath) => new PDFLoader(filePath),
    });

    const directoryDocs = await directoryLoader.load();

    return directoryDocs;
  } catch (error) {
    throw new Error("Error while loading PDF files!", { cause: error });
  }
};

const splitDocuments = async (documents) => {
  try {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 2000,
      chunkOverlap: 200,
    });

    return await splitter.splitDocuments(documents);
  } catch (error) {
    throw new Error("Error while splitting documents!", { cause: error });
  }
};

const createVectorStore = async (documents) => {
  try {
    // const embeddings = new OpenAIEmbeddings({
    //   apiKey: process.env.OPENAI_API_KEY,
    //   model: AI_CONFIG.openai.models.embedding,
    // });

    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GOOGLE_API_KEY,
      model: AI_CONFIG.gemini.models.embedding,
      taskType: TaskType.SEMANTIC_SIMILARITY,
    });


    const vectorStore = await FaissStore.fromDocuments(documents, embeddings);

    return vectorStore;
  } catch (error) {
    throw new Error("Error while creating vector store!", { cause: error });
  }
};

(async () => {
  try {
    const documentsDirectory = [
      "public/assets/documents/pdf/peraturan/",
      "public/assets/documents/pdf/pengetahuan/",
    ];
    console.info(`OPENAI API key ${process.env.OPENAI_API_KEY}`);
    console.info(`Found ${documentsDirectory.length} documents directory`);

    for (const documentDirectory of documentsDirectory) {
      const documentsPath = path.join(process.cwd(), documentDirectory);
      
      console.info(`> Parsing documents from "${documentsPath}"`);
      const docs = await loadPdfDocuments(documentsPath);
      const splittedDocs = await splitDocuments(docs);

      console.info("> Saving parsed documents...");
      const saveDirectory = path.join(
        process.cwd(),
        documentDirectory.replace("public/assets", "src/data")
      );
      const savePath = path.join(saveDirectory, "documents.json");

      await fs.mkdir(saveDirectory, { recursive: true });
      await fs.writeFile(savePath, JSON.stringify(splittedDocs), {
        encoding: "utf-8",
      });
      console.info(`> Documents parsed and saved to "${savePath}"`);

      console.info("> Creating vector store...");
      const vectorStore = await createVectorStore(splittedDocs);
      console.info("> Vector store created!");

      console.info("> Saving vector store...");
      const vectorSavePath = path.join(saveDirectory, "vector-store");
      await vectorStore.save(vectorSavePath);
      console.info(`> Vector store saved to "${vectorSavePath}"\n`);
    }
  } catch (error) {
    console.error(error);
  }
})();
