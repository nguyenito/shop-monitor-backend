const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');
const { sendNotification } = require('./monitor.js');
const axios = require('axios');
const { logEvents, logWebContent } = require('./log_events');
const { checkProductInStock } = require('./product_pattern');
require('dotenv').config();

const port = process.env.PORT || 4000;

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.listen(port, function () {
  console.log(`Server is running on port ${port}`);
  const PRODUCTS_DB_URL = `${process.env.DATABASE_URL}/products`;
  console.log(`PRODUCTS_DB_URL=${PRODUCTS_DB_URL}`);
});

app.get('/', (req, res) => {
  res.send('Welcom to Shop Monitor Service!');
});
