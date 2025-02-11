/*
This script is responsible for loading PDF documents from specific directories, processing them using LangChain's document loaders, and saving the processed content as JSON files. It's a crucial initialization step for preparing documents that will later be used for embeddings and vector search.
*/

import path from "path";
import fs from "fs/promises";

import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

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

(async () => {
  try {
    const documentsDirectory = [
      "public/assets/documents/pdf/peraturan/",
      "public/assets/documents/pdf/pengetahuan/",
    ];

    console.info(`Found ${documentsDirectory.length} documents directory`);

    for (const documentDirectory of documentsDirectory) {
      const documentsPath = path.join(process.cwd(), documentDirectory);
      console.info(`> Parsing documents from "${documentsPath}"`);

      const docs = await loadPdfDocuments(documentsPath);

      const saveDirectory = path.join(
        process.cwd(),
        documentDirectory.replace("public/assets", "src/data")
      );
      const savePath = path.join(saveDirectory, "documents.json");

      await fs.mkdir(saveDirectory, { recursive: true });
      await fs.writeFile(savePath, JSON.stringify(docs), {
        encoding: "utf-8",
      });

      console.info(`Documents parsed and saved to "${savePath}"\n`);
    }
  } catch (error) {
    console.error(error);
  }
})();
