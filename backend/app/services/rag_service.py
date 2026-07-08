import os
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

class RAGService:
    def __init__(self, persist_directory: str = "./chroma_db"):
        self.persist_directory = persist_directory
        # lightweight embedding model
        self.embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        
        # ChromaDB vector store
        self.vector_store = Chroma(
            collection_name="chatbot_knowledge",
            embedding_function=self.embeddings,
            persist_directory=self.persist_directory
        )

    def add_documents(self, texts: list[str], metadatas: list[dict] = None):
        """
        Adds text chunks to the ChromaDB vector store.
        """
        self.vector_store.add_texts(texts=texts, metadatas=metadatas)

    def search_similar_documents(self, query: str, top_k: int = 3):
        """
        Searches the vector store for the most similar documents to the query.
        Returns a list of LangChain Document objects.
        """
        return self.vector_store.similarity_search(query, k=top_k)

rag_service = RAGService()
