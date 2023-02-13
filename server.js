const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');
const { sendNotification } = require('./monitor.js');
const axios = require('axios');
const { logEvents, logWebContent } = require('./log_events');
const { checkProductInStock } = require('./product_pattern');

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

let clients = [];
let tracking_count = 1;
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

let pages_info = [];
async function checkProductStock(page_info, product) {
  try {
    await page_info['page'].goto(product.product_url, { timeout: 0 });
  } catch (errr) {
    logEvents(`Error ${errr} While Goto Page ${product.product_url}`, 'ERROR');
    return;
  }
  try {
    await page_info['page'].reload({
      waitUntil: ['networkidle0', 'domcontentloaded'],
    });
  } catch (errr) {
    logEvents(
      `Error ${errr} While Reload Page ${product.product_url}`,
      'ERROR'
    );
    return;
  }

  let evaluateDocument = null;
  try {
    evaluateDocument = await page_info['page'].evaluate(() => {
      if (document !== null) return document.body.innerHTML;
      else return null;
    });
  } catch (errr) {
    logEvents(
      `Error ${errr} While Query Document Page ${product.product_url}`,
      'ERROR'
    );
    return;
  }

  if (evaluateDocument === null) {
    logEvents(
      `Empty query body inner HTML from ${product.product_url}`,
      'ERROR'
    );
    return;
  }

  const content = evaluateDocument;
  const newStatus = checkProductInStock(product.product_url, content);
  logEvents(`Product id#${product.id} State: ${newStatus}`);
  let logWebFileName = `product_${product.id}_${newStatus}.txt`;
  logWebContent(logWebFileName, content);
  if (newStatus === 'Unknown') {
    logEvents(
      `Product id#${product.id}. Unknown Pattern Is Detected: ${product.product_url}`,
      'SILLY'
    );
  }

  let isSendAlarm = false;
  if (product.status !== newStatus) {
    let logMsg = `Product id#${product.id} State Changed From ${product.status} To ${newStatus}!!!`;
    if (product.status === 'OutStock' && newStatus === 'InStock') {
      logEvents(
        `Product id#${product.id}. Alarm Event Detected. ALRMMMMMMMMM!!!`,
        'ALARM'
      );
      isSendAlarm = true;
    }
    console.log(logMsg);
    logEvents(logMsg);

    product.status = newStatus;
    updateProductDataToDb(product);
  }
  sendProductDataToAll(product, 'information');
  if (isSendAlarm) {
    sendNotification(
      product.product_name,
      product.product_url,
      'nguyenphambaonguyen@gmail.com'
    );

    const notificationData = await fetchNotificationInfo();
    updateAlarmCountDataToDb(notificationData['alarm_count'] + 1);
    sendProductDataToAll(product, 'alarm');
  }
}

async function trackingProductsStock(browser) {
  console.log('Tracking Products In Stock...');
  logEvents(`Tracking Products In Stock #${tracking_count++} times`);
  const products_data = await fetchJSonData(PRODUCTS_DB_URL);

  if (products_data.length > pages_info.length) {
    const noOfNewPage = products_data.length - pages_info.length;
    for (let i = 0; i < noOfNewPage; ++i) {
      const page = await browser.newPage();
      console.log('Create new Page For Scraping #', i + 1);
      pages_info.push({
        page: page,
        visited: false,
        url: '',
      });
    }
  }
  console.log(`Number of Chromium Page is Running: ${pages_info.length}`);
  for (let i = 0; i < products_data.length; ++i) {
    const checkingProduct = Object.assign({}, products_data[i]);
    checkingProduct.status = 'Checking';
    await sendProductDataToAll(checkingProduct, 'information');
    checkProductStock(pages_info[i], products_data[i]);
  }
}

async function startWatcher() {
  console.log('Init Browser');
  const browser = await initBrowser();

  await trackingProductsStock(browser);
  setInterval(trackingProductsStock, MONITOR_INTERVAL_SECONDS * 1000, browser);
}

startWatcher();
