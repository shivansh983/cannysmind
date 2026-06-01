# TaskFlow

TaskFlow is a role-based task management prototype I built to practice managing complex workflows in a full-stack mobile app. It is basically a lightweight clone of tools like Jira or Asana, designed to handle three specific user roles: Admins, Managers, and standard Users.

## Tech Stack 

**Frontend (Mobile)**
* **React Native & Expo:** Used this to build cross-platform for iOS and Android without dealing with native code.
* **TypeScript:** Added to keep track of the complex task objects and catch errors early.
* **Context API & AsyncStorage:** For handling user sessions without adding the bloat of Redux.

**Backend (Server)**
* **Node.js & Express:** Standard lightweight REST API setup.
* **PostgreSQL & Sequelize:** Used a relational DB because the app has heavily connected data (Users, Tasks, Comments, Logs).
* **Redis:** Added this to cache session tokens so I don't have to hit the Postgres DB on every single API request.

## How to Run It locally

### Prerequisites
* Node.js
* PostgreSQL and Redis running locally
* Expo CLI

### Backend Setup
1. `cd backend`
2. `npm install`
3. Create a `.env` file with your Postgres and Redis connection strings.
4. Run `npx sequelize-cli db:migrate` to build the database tables.
5. Run `npm run start` (Server runs on localhost:8000).

### Frontend Setup
1. `cd mobile`
2. `npm install`
3. Run `npx expo start`
4. Open it on your phone using the Expo Go app or run it on a simulator.