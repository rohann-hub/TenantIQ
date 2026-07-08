from langchain_community.llms import Ollama
from langchain_core.prompts import PromptTemplate

class LLMService:
    def __init__(self, model_name: str = "llama3.2:1b", base_url: str = "http://localhost:11434"):
        self.llm = Ollama(model=model_name, base_url=base_url)
        
        # prompt template that integrates all our pipeline components
        template = """
You are a helpful AI customer service assistant. 
Use the following pieces of retrieved context to answer the user's question. 
If you don't know the answer based on the context, just say that you don't know, don't try to make up an answer.

System Analysis (For your understanding, do not repeat this to the user):
- Detected User Intent: {intent}
- Confidence Score: {confidence}
- Extracted Entities: {entities}

Context from Knowledge Base:
{context}

User's Question: {query}

Helpful Answer:"""
        
        self.prompt = PromptTemplate(
            template=template,
            input_variables=["intent", "confidence", "entities", "context", "query"]
        )
        
        self.chain = self.prompt | self.llm

    def generate_response(self, query: str, intent: str, confidence: float, entities: list, context_strings: list) -> str:
        """
        Generates a final response using Ollama, based on Rasa NLU and ChromaDB context.
        """
        # Format the context and entities into readable strings
        context_block = "\n\n".join(context_strings) if context_strings else "No relevant context found."
        entities_str = ", ".join([f"{e.get('entity')}: {e.get('value')}" for e in entities]) if entities else "None"
        
        try:
            # Invoke the LangChain pipeline
            response = self.chain.invoke({
                "intent": intent or "Unknown",
                "confidence": confidence or 0.0,
                "entities": entities_str,
                "context": context_block,
                "query": query
            })
            return response
        except Exception as e:
            print(f"Error generating LLM response: {e}")
            return "I'm sorry, I'm having trouble connecting to my brain right now. Please ensure Ollama is running."

llm_service = LLMService()
