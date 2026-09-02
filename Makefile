CLUSTER  ?= skillpulse
NAMESPACE ?= skillpulse-ns
BACKEND_IMAGE  ?= sach990p/backend:1.0
FRONTEND_IMAGE ?= sach990p/frontend:2.0

.PHONY: up down build load apply status logs mysql restart

up: ## One-shot: build images, create cluster, load images, apply manifests
	$(MAKE) build
	kind delete cluster --name $(CLUSTER)
	kind create cluster --config k8s/kind-deployment/kind-config.yaml --name $(CLUSTER)
	$(MAKE) load
	$(MAKE) apply
	docker system prune images -f

	@echo
	@echo "  SkillPulse is live at http://localhost:8888"
	@echo

build: ## Build backend + frontend images for the host's architecture
	docker build -t $(BACKEND_IMAGE)  ./backend
	docker build -t $(FRONTEND_IMAGE) ./frontend

load: ## Push built images into the kind node
	kind load docker-image $(BACKEND_IMAGE)  --name $(CLUSTER)
	kind load docker-image $(FRONTEND_IMAGE) --name $(CLUSTER)

apply: ## Apply manifests and wait for rollouts
	kubectl apply -f k8s/kind-deployment/namespace.yml \
	              -f k8s/kind-deployment/configMaps.yml \
	              -f k8s/kind-deployment/secrets.yml \
	              -f k8s/kind-deployment/persistentVolume.yml \
	              -f k8s/kind-deployment/pvc.yml \
	              -f k8s/kind-deployment/service.yml \
	              -f k8s/kind-deployment/mysql-deployment.yml \
	              -f k8s/kind-deployment/backend.yml \
	              -f k8s/kind-deployment/frontend.yml
	kubectl rollout status deployment/mysql-deployment    -n $(NAMESPACE) --timeout=180s
	kubectl rollout status deployment/backend-deployment   -n $(NAMESPACE) --timeout=120s
	kubectl rollout status deployment/frontend-deployment  -n $(NAMESPACE) --timeout=60s

down: ## Delete the cluster
	kind delete cluster --name $(CLUSTER)

status: ## Quick health snapshot
	@kubectl get pods,svc,endpoints -n $(NAMESPACE)

logs: ## Tail all three workloads at once
	@kubectl logs -n $(NAMESPACE) -l 'app in (mysql,backend,frontend)' --all-containers --tail=50 -f --max-log-requests=10

mysql: ## Open a mysql shell into the StatefulSet pod
	kubectl exec -it -n $(NAMESPACE) mysql-0 -- mysql -uskillpulse -pskillpulse123 skillpulse

restart: ## Rebuild + reload images, roll backend + frontend
	$(MAKE) build
	$(MAKE) load
	kubectl rollout restart deployment/backend deployment/frontend -n $(NAMESPACE)
	kubectl rollout status  deployment/backend  -n $(NAMESPACE) --timeout=120s
	kubectl rollout status  deployment/frontend -n $(NAMESPACE) --timeout=60s
