.PHONY: build up down deploy

build:
	docker-compose build

up:
	docker-compose up -d

log:
	docker-compose logs

down:
	docker-compose down

deploy: build up
	@echo "Déploiement terminé !"
