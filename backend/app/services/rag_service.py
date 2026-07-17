import os
from typing import List, Tuple
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.documents import Document


class RAGService:
    # Below this relevance score, retrieved chunks are considered too weak
    # and the LLM should answer from its own knowledge instead.
    RELEVANCE_THRESHOLD = 0.35

    def __init__(self, persist_directory: str = "./chroma_db"):
        self.persist_directory = persist_directory
        # lightweight embedding model
        self.embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

        # ChromaDB vector store
        self.vector_store = Chroma(
            collection_name="chatbot_knowledge",
            embedding_function=self.embeddings,
            persist_directory=self.persist_directory,
        )

    def add_documents(self, texts: list[str], metadatas: list[dict] = None):
        """Adds text chunks to the ChromaDB vector store."""
        self.vector_store.add_texts(texts=texts, metadatas=metadatas)

    #  kept for backward compatibility (crawler, test_rag, etc.) 
    def search_similar_documents(self, query: str, top_k: int = 3) -> List[Document]:
        """Returns a list of LangChain Document objects (no scores)."""
        return self.vector_store.similarity_search(query, k=top_k)

    # NEW: scored retrieval 
    def search_with_scores(
        self, query: str, top_k: int = 3
    ) -> List[Tuple[Document, float]]:
        """
        Returns list of (Document, distance) tuples.
        ChromaDB returns L2 distance — lower is better.
        """
        return self.vector_store.similarity_search_with_score(query, k=top_k)

    def retrieve_relevant_context(
        self, query: str, top_k: int = 3
    ) -> dict:
        """
        High-level retrieval that also decides whether the retrieved
        chunks are good enough to use.

        Returns:
            {
                "context_strings": [...],
                "scores": [...],
                "is_relevant": True/False,    # are chunks above threshold?
                "best_score": float,
            }
        """
        results = self.search_with_scores(query, top_k=top_k)

        if not results:
            return {
                "context_strings": [],
                "scores": [],
                "is_relevant": False,
                "best_score": 0.0,
            }

        # ChromaDB L2 distance: lower = more similar.
        # Convert to a 0-1 relevance score: relevance = 1 / (1 + distance)
        scored = []
        for doc, distance in results:
            relevance = 1.0 / (1.0 + distance)
            scored.append((doc.page_content, relevance))

        best_score = max(s for _, s in scored)
        is_relevant = best_score >= self.RELEVANCE_THRESHOLD

        return {
            "context_strings": [text for text, _ in scored],
            "scores": [round(score, 4) for _, score in scored],
            "is_relevant": is_relevant,
            "best_score": round(best_score, 4),
        }


rag_service = RAGService()