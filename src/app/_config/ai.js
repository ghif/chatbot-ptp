// AI Models Configuration
export const AI_CONFIG = {
  openai: {
    models: {
      chat: "gpt-4o-mini-2024-07-18",
      embedding: "text-embedding-3-large"
    },
    temperatures: {
      peraturan: 0.5,
      pengetahuan: 0.9
    },
    retries: {
      peraturan: 2,
      pengetahuan: 4
    }
  },
  gemini: {
    models: {
      chat: "gemini-1.5-flash",
      embedding: "text-embedding-004"
    },
    temperatures: {
      peraturan: 0.5,
      pengetahuan: 0.9
    },
    retries: {
      peraturan: 2,
      pengetahuan: 4
    }
  },
  vectorStore: {
    paths: {
      peraturan: "src/data/documents/pdf/peraturan/vector-store",
      pengetahuan: "src/data/documents/pdf/pengetahuan/vector-store"
    },
    retriever: {
      k: 4,
      searchType: "similarity"
    }
  }
};