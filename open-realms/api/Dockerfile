FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --legacy-peer-deps
COPY *.js ./
RUN mkdir -p /app/data
EXPOSE 3001
VOLUME [ "/app/data" ]
CMD ["node", "server.js"]
