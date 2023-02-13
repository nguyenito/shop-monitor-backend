const path = require('path');
const jsdom = require('jsdom');
const { logEvents } = require('./log_events');

function checkProductInStock(product_url, webContent) {
  const shoppeVnUrlPattern = /(https:\/\/shopee.vn)/gim;
  const shoppingYahooJpUrlPattern = /(https:\/\/store.shopping.yahoo.co.jp)/gim;
  if (shoppeVnUrlPattern.test(product_url)) {
    logEvents(`Use ShoppeVn Pattern To Check For Url: ${product_url}`);
    return checkShoppeProductInStock(webContent);
  } else if (shoppingYahooJpUrlPattern.test(product_url)) {
    logEvents(`Use ShoppingYahooJp Pattern To Check For Url: ${product_url}`);
    return checkShoppingYahooJpInStock(webContent);
  } else {
    logEvents(`Unknown Product URL Detected: ${product_url}`);
    return 'Unknown';
  }
}
function checkShoppeProductInStock(webContent) {
  const itemInStockPattern = /(aria-disabled="false">Mua ngay)</gim;
  const itemOutStockPattern = /(aria-disabled="true">Mua ngay)</gim;
  if (itemInStockPattern.test(webContent)) {
    return 'InStock';
  } else if (itemOutStockPattern.test(webContent)) {
    return 'OutStock';
  } else {
    return 'Unknown';
  }
}

function checkShoppingYahooJpInStock(webContent) {
  const dom = new jsdom.JSDOM(`${webContent}`);
  const cartButtonElement = dom.window.document.querySelector(
    '.mdCartButton#cart_button'
  );
  if (cartButtonElement === null) return 'Unknown';

  const cartButtonContent = cartButtonElement.innerHTML;
  //Check In Stock
  const itemInStockPattern = /(class="elButton")/gim;
  const itemOutStockPattern_1 = /(class="elButton\s+isDisabled\s*")/gim;
  const itemOutStockPattern_2 = /(在庫がありません)/gim;

  if (
    itemOutStockPattern_1.test(cartButtonContent) ||
    itemOutStockPattern_2.test(cartButtonContent)
  ) {
    return 'OutStock';
  } else if (itemInStockPattern.test(webContent)) {
    return 'InStock';
  }

  return 'Unknown';
}

// const fs = require('fs');
// function testPattern() {
//   const webContent = fs.readFileSync('./Logs/product_2_Unknown.txt', 'utf8');
//   console.log(checkShoppingYahooJpInStock(webContent));
// }

module.exports = { checkProductInStock };
