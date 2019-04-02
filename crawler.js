const puppeteer = require('puppeteer');
const https = require('https');
const fs = require('fs');
const uuidv4 = require('uuid/v4');

(async () => {
    const browser = await puppeteer.launch({
        headless: false // Puppeteer is 'headless' by default.
    });
    const page = await browser.newPage();
    let pageUrl = 'https://grocery.walmart.com/';
    
    await page.setViewport({ width: 1920, height: 1200})
    await page.goto(pageUrl, {
        waitUntil: 'networkidle0' // 'networkidle0' is very useful for SPAs.
    });
    
    let pageBaseUrl = 'https://grocery.walmart.com/search/?query=';

    // Read in JSON List
    let products = JSON.parse(fs.readFileSync('products.json'));

    for(let product of products) {
        // console.log('title: ' + product.title);
        const query = encodeURI(product.title.toLowerCase());
        const searchQueryUrl = pageBaseUrl + query;

        await page.goto(searchQueryUrl, {
            waitUntil: 'networkidle0' // 'networkidle0' is very useful for SPAs.
        });

        let url = await page.evaluate(() => {
            let objectList = document.querySelectorAll('td a img');
            let src = objectList[0].src;

            return src;
        });

        const filename = uuidv4() + '.jpg';
        const file = fs.createWriteStream('thumbnails/' + filename);

        await new Promise((resolve) => {
            https.get(url, function(response) {
                response.pipe(file);
                resolve();
            });
        }, url, file);

        product.url = filename;
    }

    fs.writeFileSync('products.json', JSON.stringify(products));
})();