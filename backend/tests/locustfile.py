from locust import HttpUser, task, between
import os

class WebsiteUser(HttpUser):
    wait_time = between(1, 5)
    @task
    def index(self):
        self.client.get("/")