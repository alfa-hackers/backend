# Install deps:

```
yarn install
docker compose up postgres -d
docker compose up redis -d
docker compose -f docker-compose.kratos.yaml up -d
```

# Available scripts:

```
yarn start:dev
```

```
start: "nest start",
start:dev: "nest start --watch",
start:debug: "nest start --debug --watch",
start:prod: "NODE_ENV=production node dist/main",
```
