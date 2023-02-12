const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');
const { sendNotification } = require('./monitor.js');
const axios = require('axios');

const port = process.env.PORT || 4000;

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.listen(port, function () {
  console.log(`Server is running on port ${port}`);
});

app.get('/', (req, res) => {
  res.send('Welcom to Shop Monitor Service!');
});

const MONITOR_INTERVAL_SECONDS = 60;
const JSON_SERVER = 'http://localhost:3001';
const DATABASE_URL = `${JSON_SERVER}`;
const PRODUCTS_DB_URL = `${DATABASE_URL}/products`;

clients = [];

async function fetchJSonData(url) {
  return axios
    .get(url)
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      console.log(error);
      return [];
    });
}

async function updateProductDataToDb(product) {
  let url = `${PRODUCTS_DB_URL}/${product.id}`;
  return axios.put(url, product).catch((error) => {
    console.log(error);
    return;
  });
}

async function fetchNotificationInfo() {
  let url = `${DATABASE_URL}/notification_info/1`;
  return fetchJSonData(url);
}

async function updateAlarmCountDataToDb(alarmCount) {
  let url = `${DATABASE_URL}/notification_info/1`;
  return axios.patch(url, { alarm_count: alarmCount }).catch((error) => {
    console.log(error);
    return;
  });
}

async function sendProductDataToAll(product, event_type) {
  product['event_type'] = event_type;
  const data = `data: ${JSON.stringify(product)}\n\n`;
  for (let i = 0; i < clients.length; ++i) {
    clients[i].response.write(data);
  }
}

function sendEventData(response, products_data, event_type) {
  for (let i = 0; i < products_data.length; ++i) {
    products_data[i]['event_type'] = event_type;
    const data = `data: ${JSON.stringify(products_data[i])}\n\n`;
    response.write(data);
  }
}

async function eventsHandler(res, response, next) {
  const headers = {
    'Content-Type': 'text/event-stream',
    Connection: 'keep-alive',
    'Cache-Control': 'no-cache',
  };
  response.writeHead(200, headers);

  const productsData = await fetchJSonData(PRODUCTS_DB_URL);
  sendEventData(response, productsData, 'information');

  const clientId = Date.now();
  const newClient = {
    id: clientId,
    response,
  };
  clients.push(newClient);

  res.on('close', () => {
    console.log(`${clientId} Connection closed`);
    clients = clients.filter((client) => client.id !== clientId);
  });
}
app.get('/events', eventsHandler);

async function initBrowser() {
  const browser = await puppeteer.launch({ headless: true });
  return browser;
}

function checkUdemyExample(webContent) {
  const itemDetailPattern = /class="(item-detail_.*?)"/g;
  const soldOutPattern = /soldout/gi;
  const itemMatch = [...webContent.matchAll(itemDetailPattern)];

  let isSoldOut = false;
  if (itemMatch != null) {
    for (let i = 0; i < itemMatch.length; i++) {
      matchContent = itemMatch[i][1];
      if (soldOutPattern.test(matchContent)) {
        isSoldOut = true;
        break;
      }
    }
  }
  return isSoldOut;
}

let pages = [];
async function checkProductStock(page, product) {
  await page.goto(product.product_url, { timeout: 0 });

  let evaluateDocument = null;
  while (evaluateDocument === null) {
    evaluateDocument = await page.evaluate(() => {
      if (document != null) return document.body.innerHTML;
      else return null;
    });
  }

  const content = evaluateDocument;
  let isSoldOut = checkUdemyExample(content);
  let newStatus = 'Unknown';

  if (isSoldOut) {
    newStatus = 'OutStock';
  } else {
    newStatus = 'InStock';
  }

  let isSendAlarm = false;
  if (product.status !== newStatus) {
    console.log(`Product id#${product.id} State Changed. ALARM!!!`);
    product.status = newStatus;
    console.log(product);

    sendNotification(
      product.product_name,
      product.product_url,
      'nguyenphambaonguyen@gmail.com'
    );
    updateProductDataToDb(product);
    isSendAlarm = true;
  }
  sendProductDataToAll(product, 'information');
  if (isSendAlarm) {
    const notificationData = await fetchNotificationInfo();
    updateAlarmCountDataToDb(notificationData['alarm_count'] + 1);
    sendProductDataToAll(product, 'alarm');
  }
}

async function trackingProductsStock(browser) {
  console.log('Tracking Products In Stock...');
  const products_data = await fetchJSonData(PRODUCTS_DB_URL);
  if (products_data.length > pages.length) {
    const noOfNewPage = products_data.length - pages.length;
    for (let i = 0; i < noOfNewPage; ++i) {
      const page = await browser.newPage();
      pages.push(page);
    }
  }
  console.log(`Number of Chromium Page is Running: ${pages.length}`);
  for (let i = 0; i < products_data.length; ++i) {
    const checkingProduct = Object.assign({}, products_data[i]);
    checkingProduct.status = 'Checking';
    await sendProductDataToAll(checkingProduct, 'information');
    checkProductStock(pages[i], products_data[i]);
  }
}

async function startWatcher() {
  console.log('Init Browser');
  const browser = await initBrowser();

  await trackingProductsStock(browser);
  setInterval(trackingProductsStock, MONITOR_INTERVAL_SECONDS * 1000, browser);
}

startWatcher();
