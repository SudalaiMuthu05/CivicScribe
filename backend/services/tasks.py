from celery_worker import celery_app


@celery_app.task
def process_test_task():
    return "Background task completed successfully!"