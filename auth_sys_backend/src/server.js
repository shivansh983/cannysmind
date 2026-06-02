const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const {Model} = require('sequelize') 
const path = require('path');

require('dotenv').config({ path: '../.env' });


const app = express();
const PORT = process.env.PORT || 8000;

app.use((req, res, next) => {
  console.log(`📡 RADAR: [${req.method}] ${req.url}`);
  next();
});


app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: true, //channgeit to url before live
  credentials: true,
}));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Cannyminds Auth API is running' });
});

const routes = require('./routes');
app.use('/api', routes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});