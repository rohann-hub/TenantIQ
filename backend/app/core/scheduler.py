from apscheduler.schedulers.background import BackgroundScheduler
from app.services.crawler_service import crawler_service
from app.services.memory_service import memory_service


TARGET_URLS = []


def scheduled_crawl_job():
    print("Running scheduled web crawl...")
    for url in TARGET_URLS:
        crawler_service.process_and_index_url(url)
    print("Scheduled crawl completed.")


def scheduled_memory_cleanup():
    """Remove expired conversation sessions to free memory."""
    removed = memory_service.cleanup_expired()
    if removed:
        print(f"Memory cleanup: removed {removed} expired session(s).")


def start_scheduler():
    scheduler = BackgroundScheduler()
    # Run the crawl immediately on startup
    scheduler.add_job(scheduled_crawl_job)
    scheduler.add_job(scheduled_crawl_job, "interval", hours=24)

    # Memory cleanup every 15 minutes
    scheduler.add_job(scheduled_memory_cleanup, "interval", minutes=15)

    scheduler.start()
    print("Background scheduler started.")