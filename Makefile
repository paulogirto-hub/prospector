.PHONY: help up down logs test lint validate clean

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

up: ## Start all services with Docker
	docker compose up -d --build

down: ## Stop all services
	docker compose down

logs: ## View logs (follow mode)
	docker compose logs -f

restart: ## Restart all services
	docker compose restart

test: ## Run backend tests
	cd backend && python -m pytest tests/ -v --tb=short

lint: ## Lint backend code
	cd backend && flake8 app/ --max-line-length=120 --exclude=__pycache__,venv

validate: ## Validate meta-framework
	python3 scripts/validate-framework.py --path docs/meta-framework -v

setup: ## First-time setup (copy .env and install deps)
	cp .env.example .env
	@echo "✅ .env created — edit with your API keys"
	cd backend && python -m venv venv && . venv/bin/activate && pip install -r requirements.txt

clean: ## Remove generated files
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	rm -rf backend/venv .pytest_cache

build: ## Build Docker images
	docker compose build

ps: ## List running services
	docker compose ps