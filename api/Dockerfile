FROM node:alpine AS builder
WORKDIR /app
COPY ./package*.json ./
RUN npm install --production
COPY . .

FROM node:20.10.0
WORKDIR /app
COPY --from=builder /app ./
CMD ["npm", "run", "build"]
CMD ["node", "dist/index.js"]