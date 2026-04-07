# Use official Node image
FROM node:18

# Create working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project
COPY . .

# Expose port
EXPOSE 8080

# Start app
CMD ["node", "app.js"]