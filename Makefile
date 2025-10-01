COMPOSE_FILE = src/core/docker/docker-compose.yml

# Levanta los contenedores en segundo plano (-d).
up:
	docker-compose -f $(COMPOSE_FILE) up -d

# Detiene y elimina los contenedores, redes y volúmenes.
down:
	docker-compose -f $(COMPOSE_FILE) down

# Muestra los logs de los contenedores en tiempo real (-f).
logs:
	docker-compose -f $(COMPOSE_FILE) logs -f

# Muestra el estado de los contenedores del proyecto.
ps:
	docker-compose -f $(COMPOSE_FILE) ps