# Imagem base oficial do Node.js (Alpine para menor tamanho e maior segurança)
FROM node:20-alpine

# Diretório de trabalho da aplicação
WORKDIR /app

# Copia os arquivos de definição de pacotes
COPY package*.json ./

# Instala apenas as dependências de produção para otimizar o tamanho final da imagem
RUN npm ci --omit=dev --ignore-scripts

# Copia o código-fonte da aplicação
COPY src/ ./src/

# Expõe a porta configurada no server.js (8080)
EXPOSE 8080

# Define o ambiente como produção
ENV NODE_ENV=production

# Comando de inicialização do servidor
CMD ["node", "src/server.js"]
