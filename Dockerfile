FROM node:20

# Instalar dependencias necesarias para Puppeteer/Chromium
RUN apt-get update && apt-get install -y \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpangocairo-1.0-0 \
    libpango-1.0-0 \
    libcairo2 \
    libatspi2.0-0 \
    libgtk-3-0 \
    wget \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar e instalar dependencias de Node
COPY package*.json ./
RUN npm install

# Copiar carpeta de imágenes
COPY images ./images

# Copiar archivos JS necesarios
COPY .env .
COPY api.js .
COPY change_email.js .
COPY change_password.js .
COPY courses.js .
COPY key_course.js .
COPY laboral.js .
COPY main.js .
COPY message_response.js .
COPY perfil_moodle.js .
COPY personal.js .
COPY search_email.js .
COPY users.js .
COPY verify_error.js .
COPY welcome.js .
COPY moodle_account .

CMD ["node", "main.js"]


