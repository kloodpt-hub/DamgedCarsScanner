FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --include=dev

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .

RUN npm run build

EXPOSE 10000

CMD ["npm", "start"]
