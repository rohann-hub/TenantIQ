import requests
from bs4 import BeautifulSoup
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.services.rag_service import rag_service

class CrawlerService:
    def __init__(self):
        # We use a RecursiveCharacterTextSplitter to create context chunks
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=100,
            length_function=len,
        )

    def scrape_url(self, url: str) -> str:
        """
        Fetches the URL and extracts clean text using BeautifulSoup.
        """
        try:
            response = requests.get(url, timeout=10.0)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Remove script and style elements
            for script in soup(["script", "style", "header", "footer", "nav"]):
                script.extract()
                
            text = soup.get_text(separator=' ')
            
            # Clean up whitespace
            lines = (line.strip() for line in text.splitlines())
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            clean_text = ' '.join(chunk for chunk in chunks if chunk)
            
            return clean_text
        except Exception as e:
            print(f"Failed to scrape {url}: {e}")
            return ""

    def process_and_index_url(self, url: str):
        """
        Scrapes a URL, splits the text into chunks, and saves to ChromaDB.
        """
        print(f"Starting crawl for {url}...")
        text = self.scrape_url(url)
        
        if not text:
            print(f"No content extracted from {url}.")
            return
            
        chunks = self.text_splitter.split_text(text)
        
        # Create metadata for each chunk
        metadatas = [{"source": url, "chunk_index": i} for i in range(len(chunks))]
        
        # Add to ChromaDB
        rag_service.add_documents(texts=chunks, metadatas=metadatas)
        print(f"Successfully indexed {len(chunks)} chunks from {url}.")

crawler_service = CrawlerService()
