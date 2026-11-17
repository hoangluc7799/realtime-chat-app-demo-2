FROM node:20-alpine

WORKDIR /src

# Copy file khai báo thư viện
COPY package*.json ./

# Cài đặt thư viện bên trong container
RUN npm install

# Copy toàn bộ mã nguồn
COPY . .

# Mở cổng cho ứng dụng
EXPOSE 3000

# Lệnh tự động chạy app khi bật container
CMD ["npm", "start"]