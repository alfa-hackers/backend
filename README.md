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

## 📦 Локальная разработка

### Требования

```bash
- Node.js >= 18.x
- Docker >= 24.x
- pnpm >= 8.x
- yarn >= 1.22.x
- direnv (опционально, для управления окружением)
- NestJS >= 10.x
```

### Настройка Backend

```bash
cd backend

cp envrc.example envrc
direnv allow
docker-compose up -d
docker-compose -f docker-compose.kratos.yaml up -d
yarn install
yarn test --coverage
yarn start:dev
```

**Backend доступен по адресу**: `http://localhost:3000`  
**API-документация**: `http://localhost:3000/api`
