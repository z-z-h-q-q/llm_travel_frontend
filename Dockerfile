### Build stage
FROM crpi-qk3obbgceulitt7u.cn-shanghai.personal.cr.aliyuncs.com/llm_course/node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY tsconfig*.json ./
RUN npm ci
COPY . .
RUN npm run build

### Production stage
FROM crpi-qk3obbgceulitt7u.cn-shanghai.personal.cr.aliyuncs.com/llm_course/nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Optional: copy custom nginx config
# COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
