const fs = require('fs').promises;
const path = require('path');
const { format } = require('date-fns');

async function logEvents(msg, eventType = 'INFO') {
  try {
    const currentDate = new Date();

    const logDate = `${format(currentDate, `yyyy-MM-dd`)}`;
    const logFile = path.join(__dirname, './logs/events', `${logDate}.log`);
    const contentLog = `${currentDate.toISOString()} - [${eventType}] - ${msg}\n`;
    fs.appendFile(logFile, contentLog);
  } catch (err) {
    console.log(err);
  }
}

async function logWebContent(logName, webContent) {
  try {
    const timeStamp = `${format(new Date(), `dd-MM-yyyy_ss-mm-HH`)}`;
    const fileName = path.join(__dirname, './logs/web_contents', `${logName}`);

    const contentLog = `Logging Web Content At ${timeStamp}\n${webContent}\n`;
    fs.writeFile(fileName, contentLog);
  } catch (err) {
    console.log(err);
  }
}

module.exports = { logEvents, logWebContent };
