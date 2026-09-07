from locust import HttpUser, task, between

class NginxUser(HttpUser):
    # Simula un tiempo de espera entre tareas de 1 a 2 segundos
    wait_time = between(1, 2)
    
    @task
    def load_page(self):
        self.client.get("/")
