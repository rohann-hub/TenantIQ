from app.services.rag_service import rag_service

print("Adding test documents to ChromaDB...")

#  dummy knowledge base 
documents = [
    "Our premium plan costs $49 per month and includes priority support.",
    "The basic plan is free but only allows up to 100 messages a day.",
    "You can contact support by emailing help@chatbot.com.",
    "Our company was founded in 2024 to revolutionize AI customer service."
]

# Add to vector store
rag_service.add_documents(texts=documents)

print("Documents added successfully!")
print("Testing semantic search directly...")

# Test a search
query = "What is the price of the premium plan?"
results = rag_service.search_similar_documents(query, top_k=2)

print(f"\nQuery: '{query}'")
print("Top Context Retrieved:")
for i, doc in enumerate(results):
    print(f"{i+1}. {doc.page_content}")
