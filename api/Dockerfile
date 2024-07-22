FROM node:18.18.0
WORKDIR /app
COPY ./package*.json ./
RUN npm install
COPY ./dist ./dist
CMD ["npm","run","start"]
