FROM node:20-alpine

WORKDIR usr/src/app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

EXPOSE 5002

CMD [ "npm", "start" ]