const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const {Model} = require('sequelize') 
const commentRoutes = require('./api/comments/routes'); 
const logRoutes = require('./api/logs/routes');

require('dotenv').config({ path: '../.env' });


const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: true,
  credentials: true,
}));
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Cannyminds Auth API is running' });
});

const routes = require('./routes');
app.use('/api', routes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});