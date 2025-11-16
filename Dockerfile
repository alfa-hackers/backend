FROM node:25-slim

WORKDIR /app

COPY package*.json ./

RUN yarn install --frozen-lockfile

COPY . .

RUN yarn run build

RUN mkdir -p static/images uploads

CMD ["yarn", "run", "start:prod"]
