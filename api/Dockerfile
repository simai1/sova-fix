FROM node:alpine AS builder
WORKDIR /app
COPY ./package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20.10.0
WORKDIR /app
COPY --from=builder /app ./
CMD ["node", "dist/index.js"]