from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from app.services.crawler_service import crawler_service

router = APIRouter()

class CrawlRequest(BaseModel):
    url: str

@router.post("/crawl")
async def crawl_endpoint(request: CrawlRequest, background_tasks: BackgroundTasks):
    """
    Endpoint to dynamically crawl a website and add its content to the knowledge base.
    Runs the crawler in the background so the API returns quickly.
    """
    if not request.url.startswith("http"):
        raise HTTPException(status_code=400, detail="Must be a valid HTTP/HTTPS URL")
    
    
    background_tasks.add_task(crawler_service.process_and_index_url, request.url)
    
    return {"status": "success", "message": f"Started crawling {request.url}. The knowledge base will be updated shortly."}
