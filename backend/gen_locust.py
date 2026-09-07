#!/usr/bin/env python3
import sys
url = sys.argv[1] if len(sys.argv) > 1 else "http://nginx.org/"
with open("/tmp/locustfile.py", "w") as f:
    f.write(f'''from locust import HttpUser, task, between

class StressUser(HttpUser):
    wait_time = between(0.1, 0.5)

    @task
    def test_endpoint(self):
        self.client.get("{url}")
''')
print("locustfile.py created")
