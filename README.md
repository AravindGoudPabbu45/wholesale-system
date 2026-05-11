# WholesaleERP - Smart Inventory Management System

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.0-green.svg)
![React](https://img.shields.io/badge/React-18.0-blue.svg)
![MySQL](https://img.shields.io/badge/MySQL-8.0-orange.svg)

**WholesaleERP** is an AI-driven, multi-branch B2B wholesale automation platform. It serves as a complete business workflow engine mimicking modern B2B operations with advanced features like an order workflow engine, real-time tracking, smart insights, logistics, finance automation, and instant notifications.

## 🚀 Features

- **Order Workflow Engine**: Granular tracking system for order lifecycle (Approve, Pack, Ship, Track, Delivered).
- **Smart Inventory Management**: AI-driven insights, manual adjustments, and threshold-based restocking alerts.
- **Role-Based Access Control**: Secure JWT-based authentication for Super Admins, Branch Managers, and Employees.
- **Logistics & Tracking**: Amazon-style simulated GPS location tracking for real-time order visibility.
- **Finance Automation**: Automated invoicing, payment tracking, and ledger management.
- **Modern UI/UX**: Premium, action-driven glassmorphism interface built with React.

## 🛠️ Technology Stack

### Backend
- Java 17+
- Spring Boot (Web, Data JPA, Security)
- MySQL Database
- JWT Authentication
- Spring Boot Actuator

### Frontend
- React.js 18
- React Router DOM
- CSS3 (Vanilla CSS with Premium UI Design)

## 📁 Project Structure

```text
wholesale-system/
├── backend/          # Spring Boot application, APIs, and business logic
│   ├── src/main/     # Java source code and application.properties
│   └── pom.xml       # Maven dependencies
├── frontend/         # React.js application
│   ├── src/          # Components, Context, Pages, Services
│   └── package.json  # NPM dependencies
└── README.md         # Project documentation
```

## ⚙️ Environment Setup & Installation

### Prerequisites
- JDK 17 or higher
- Node.js (v16+) and npm
- MySQL (v8.0+)
- Maven

### 1. Database Configuration
1. Create a MySQL database named `wholesale_db`.
2. Configure your database credentials in `backend/src/main/resources/application.properties`:
   ```properties
   spring.datasource.username=root
   spring.datasource.password=YOUR_DB_PASSWORD
   app.jwt.secret=YOUR_JWT_SECRET
   ```

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Build and run the Spring Boot application:
   ```bash
   mvn clean install
   mvn spring-boot:run
   ```
   The backend will start on `http://localhost:8080`.

### 3. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the React development server:
   ```bash
   npm start
   ```
   The frontend will start on `http://localhost:3000`.

## 🛡️ Security Note
All sensitive configurations, tokens, and database passwords have been omitted from this repository for security purposes. Please populate `.env` files and properties according to your local environment.

## 📄 License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
