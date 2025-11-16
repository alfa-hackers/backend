[![codecov](https://codecov.io/gh/alfa-hackers/backend/graph/badge.svg?token=PIHG47NVOK)](https://codecov.io/gh/alfa-hackers/backend)

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

| Скрипт      | Команда                              |
| ----------- | ------------------------------------ |
| start       | `nest start`                         |
| start:dev   | `nest start --watch`                 |
| start:debug | `nest start --debug --watch`         |
| start:prod  | `NODE_ENV=production node dist/main` |
| test        | `jest`                               |
| test:cov    | `jest --coverage`                    |
