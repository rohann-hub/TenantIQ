from apscheduler.schedulers.background import BackgroundScheduler
from app.services.crawler_service import crawler_service


TARGET_URLS = []

def scheduled_crawl_job():
    print("Running scheduled web crawl...")
    for url in TARGET_URLS:
        crawler_service.process_and_index_url(url)
    print("Scheduled crawl completed.")

def start_scheduler():
    scheduler = BackgroundScheduler()
    # Run the crawl 
    scheduler.add_job(scheduled_crawl_job)
    
    scheduler.add_job(scheduled_crawl_job, 'interval', hours=24)
    scheduler.start()
    print("Background scheduler started.")
