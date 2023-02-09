// const puppeteer = require('puppeteer');
// const fs = require('fs');
// const { CronJob } = require('cron');
// const nodemailer = require('nodemailer');

// // const rand_url = 'https://scraping.official.ec/items/40792454';//Out of Stock
// const rand_url = 'https://scraping.official.ec/items/40792284'; //In Stock

// async function initBrowser() {
//   const browser = await puppeteer.launch({ headless: true });
//   const page = await browser.newPage();
//   return page;
// }

// async function checkStock(page) {
//   await page.goto(rand_url);
//   let content = await page.evaluate(() => document.body.innerHTML);

//   let isSoldOut = checkUdemyExample(content);
//   if (isSoldOut) console.log('Out Of Stock');
//   else {
//     console.log('Product In Stock');
//     // await sendNotification(rand_url, 'nguyenphambaonguyen@gmail.com');
//   }

//   console.log('Done');
// }

// function checkUdemyExample(webContent) {
//   const itemDetailPattern = /class="(item-detail_.*?)"/g;
//   const soldOutPattern = /soldout/gi;
//   const itemMatch = [...webContent.matchAll(itemDetailPattern)];

//   let isSoldOut = false;
//   if (itemMatch != null) {
//     for (let i = 0; i < itemMatch.length; i++) {
//       matchContent = itemMatch[i][1];
//       if (soldOutPattern.test(matchContent)) {
//         isSoldOut = true;
//         break;
//       }
//     }
//   }
//   return isSoldOut;
// }

// async function monitor() {
//   console.log('Init Browser and Go the web page');
//   let page = await initBrowser();

//   let job = new CronJob(
//     '*/1 * * * *',
//     function () {
//       console.log('Checking stock...');
//       checkStock(page);
//     },
//     null,
//     true,
//     null,
//     null,
//     true
//   );
//   job.start();
// }

// async function sendNotification(web_url, recvEmail) {
//   let transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//       user: 'npbnguyenbot@gmail.com',
//       pass: 'zbpugjpwgqrwhnsk',
//     },
//   });

//   let textToSend =
//     'Dear Friend, \n\nAs you might know I been monitoring this product day and night for you.\nIT IS IN STOCK NOW.\nSo do not miss this chance. Go and get it now!\n';
//   let htmlText = 'Product Link: ' + web_url;
//   textToSend = textToSend + htmlText;

//   let mailOptions = {
//     from: 'Online Shop Monitor <npbnguyenbot@gmail.com>',
//     to: recvEmail,
//     subject: 'UDEMY QQQ PRODUCT IS IN STOCK',
//     text: textToSend,
//   };

//   transporter.sendMail(mailOptions, function (error, info) {
//     if (error) {
//       console.log(error);
//     } else {
//       console.log('Email sent: ' + info.response);
//     }
//   });
// }

// // sendNotification(rand_url, 'nguyenphambaonguyen@gmail.com');

async function monitorTest() {
  console.log('Init Browser and Go the web page');

  setInterval(() => {
    console.log('Checking stock...');
    const randNumber = Math.floor(Math.random() * 2);
    if (randNumber == 0) {
      const productQuantity = Math.floor(Math.random() * 100) + 1;
      console.log(`Product In Stock. Product Quantity ${productQuantity}`);
    } else {
      console.log('Product Out of Stock');
    }
  }, 5000);
}

module.exports = { monitorTest };
