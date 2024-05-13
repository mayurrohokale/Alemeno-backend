# Alemeno - Course Management System Backend

This is the backend for a course management system web application built using Node.js and MongoDB.

## Features

- **API Endpoints:**
  - `/courses`: Get all courses
  - `/courses/:id`: Get course by ID
  - `/courses/enrolled`: Get courses enrolled by student
  - `/profile`: Student dashboard
  - `/login`: Login the user
  - `/signup`: New registration of user

## Setup

1. Clone the repository: 
   ```sh
   git clone https://github.com/mayurrohokale/Alemeno-backend

##**Install Dependencies: npm install**

Configure environment variables: Create a .env file and add 
 - mongourl=mongodb+srv://mayurrohokale12345:HnbXwhYhoTg90dZJ@cluster0.8ywfzss.mongodb.net/courses-db

 - Run the server: npm start

**##Technologies Used**
 - Node.js
 - Express
 - MongoDB
 - Mongoose
