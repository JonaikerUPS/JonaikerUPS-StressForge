from locust import HttpUser, task, between
import os
import json

class WebsiteUser(HttpUser):
    wait_time = between(1, 5)
    @task
    def index(self):
        method = os.environ.get("TEST_METHOD", "GET").upper()
        body_str = os.environ.get("TEST_BODY", "{}")
        target_url = os.environ.get("TEST_TARGET_URL", "/")
        try:
            body = json.loads(body_str)
        except:
            body = {}
        headers = {"Content-Type": "application/json"}
        
        if method == "POST":
            self.client.post(target_url, json=body, headers=headers)
        elif method == "PUT":
            self.client.put(target_url, json=body, headers=headers)
        elif method == "DELETE":
            self.client.delete(target_url, headers=headers)
        elif method == "PATCH":
            self.client.patch(target_url, json=body, headers=headers)
        else:
            self.client.get(target_url, headers=headers)
