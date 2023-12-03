FROM node:18-alpine
WORKDIR /app
COPY *.json .
RUN yarn install
COPY ./src ./src
EXPOSE 5000
CMD ["yarn", "start:watch"]
