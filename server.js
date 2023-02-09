const express = require('express');

const app = express();
const port = process.env.PORT || 4000;

const getStockPrice = (range, base) =>
  (Math.random() * range + base).toFixed(2);
const getTime = () => new Date().toLocaleTimeString();

app.post('/stream', function (req, res) {
  res.writeHead(200, {
    Connection: 'keep-alive',
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
  });
  setInterval(() => {
    res.write(
      `data: {"time": "${getTime()}", "aTechStockPrice": "${getStockPrice(
        2,
        20
      )}", "bTechStockPrice": "${getStockPrice(4, 22)}"}`
    );
    res.write('\n\n');
  }, 5000);
});

app.get('/', (req, res) => {
  res.send('Welcom to Shop Monitor Service!');
});
app.listen(port, function () {
  console.log(`Server is running on port ${port}`);
});
