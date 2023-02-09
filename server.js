const express = require('express');

const app = express();
const port = process.env.PORT || 4000;

app.get('/', (req, res) => {
  res.send('Welcom to Shop Monitor Service!');
});
app.listen(port, function () {
  console.log(`Server is running on port ${port}`);
});
