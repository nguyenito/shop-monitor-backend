const nodemailer = require('nodemailer');

async function sendNotification(productName, productLink, recvEmail) {
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'npbnguyenbot@gmail.com',
      pass: 'zbpugjpwgqrwhnsk',
    },
  });

  let textToSend =
    'Dear Friend, \n\nAs you might know I been monitoring this product day and night for you.\nIT IS IN STOCK NOW.\nSo do not miss this chance. Go and get it now!\n';
  let htmlText = 'Product Link: ' + productLink;
  textToSend = textToSend + htmlText;

  let mailOptions = {
    from: 'Online Shop Monitor <npbnguyenbot@gmail.com>',
    to: recvEmail,
    subject: `PRODUCT [${productName}] IS IN STOCK`,
    text: textToSend,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
}

module.exports = { sendNotification };
