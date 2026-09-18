from celery import Celery

celery_app = Celery(
    "grievance_scribe",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0",
    include=["services.tasks"]
)


@celery_app.task
def test_task():
    return "Celery is working!"