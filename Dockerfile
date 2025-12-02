# 构建阶段
FROM swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/node:20-alpine AS builder

WORKDIR /app

# 清除代理环境变量（避免容器内无法连接宿主机代理）
ENV HTTP_PROXY=""
ENV HTTPS_PROXY=""
ENV http_proxy=""
ENV https_proxy=""

# 配置 npm/yarn 镜像源并清除代理
RUN unset HTTP_PROXY HTTPS_PROXY http_proxy https_proxy && \
    npm config delete proxy && \
    npm config delete https-proxy && \
    npm config set registry https://registry.npmmirror.com && \
    yarn config delete proxy && \
    yarn config delete https-proxy && \
    yarn config set registry https://registry.npmmirror.com

# 复制依赖文件
COPY package.json ./

# 安装依赖
RUN unset HTTP_PROXY HTTPS_PROXY http_proxy https_proxy && yarn install

# 复制源代码
COPY . .

# 调试：检查文件内容
RUN cat src/views/orangepi/useOrangePi.ts | grep publicToken

# 构建参数
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# 构建生产版本
RUN yarn build

# 运行阶段
FROM swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/nginx:alpine

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
