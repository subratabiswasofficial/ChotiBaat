# Use an official Node.js runtime as the base image
FROM node:alpine3.20

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Command to run the application
CMD ["npm", "run", "dev"]