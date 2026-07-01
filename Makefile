COMPOSE_TEST = docker compose -f docker-compose.test.yml

# --- Build ---

build-test:
	$(COMPOSE_TEST) build

build-no-cache:
	$(COMPOSE_TEST) build --no-cache

# --- CI ---

test: validate test-unit test-e2e
	$(COMPOSE_TEST) down -v

# --- Unit / Validate ---

test-unit:
	$(COMPOSE_TEST) run --rm test-unit npm test

validate:
	$(COMPOSE_TEST) run --rm test-unit npm run validate

# --- E2E ---

test-e2e: _start-app
	$(COMPOSE_TEST) run --rm -p 9323:9323 playwright npx playwright test

test-ui: _start-app
	$(COMPOSE_TEST) run --rm -p 9323:9323 playwright npm run test:ui

test-file: _start-app
	$(COMPOSE_TEST) run --rm -p 9323:9323 playwright npx playwright test $(FILE)

rebuild-app:
	$(COMPOSE_TEST) up -d --build web

rebuild-mock:
	$(COMPOSE_TEST) restart mock-server

rebuild-all:
	$(COMPOSE_TEST) down -v
	$(COMPOSE_TEST) build

# --- Helpers ---

_start-app:
	$(COMPOSE_TEST) up -d migrate mock-server web

stop-test:
	$(COMPOSE_TEST) down -v
