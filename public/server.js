const express = require('express');
const puppeteer = require('puppeteer');
const JSZip = require('jszip');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.static('public'));
app.use(express.json());

// Endpoint to scrape the website
app.post('/scrape', async (req, res) => {
    const { url, downloadZip } = req.body;
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle2' });

        // Get the HTML content
        const html = await page.content();

        // Get CSS and JS content
        const cssFiles = await page.evaluate(() =>
            Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(link => link.href)
        );
        const jsFiles = await page.evaluate(() =>
            Array.from(document.querySelectorAll('script[src]')).map(script => script.src)
        );

        // Get cookies
        const cookies = await page.cookies();

        // Capture screenshot
        const screenshotPath = path.join(__dirname, 'screenshot.png');
        await page.screenshot({ path: screenshotPath });

        await browser.close();

        const responseJson = {
            screenshotUrl: '/screenshot.png',
            results: {
                html,
                cssFiles,
                jsFiles,
                cookies: JSON.stringify(cookies, null, 2)
            }
        };

        if (downloadZip) {
            // Create a ZIP file with the scraped data
            const zip = new JSZip();
            zip.file('index.html', html);

            for (const file of cssFiles) {
                const response = await page.goto(file);
                zip.file(path.basename(file), await response.buffer());
            }

            for (const file of jsFiles) {
                const response = await page.goto(file);
                zip.file(path.basename(file), await response.buffer());
            }

            zip.file('cookies.json', JSON.stringify(cookies, null, 2));
            zip.file('screenshot.png', fs.readFileSync(screenshotPath));

            const zipPath = path.join(__dirname, 'scraped_data.zip');
            const zipData = await zip.generateAsync({ type: 'nodebuffer' });
            fs.writeFileSync(zipPath, zipData); // Save ZIP file

            responseJson.zipUrl = '/download';
        }

        fs.unlinkSync(screenshotPath); // Clean up screenshot file

        res.json(responseJson);

    } catch (error) {
        res.status(500).send('Error occurred: ' + error.message);
    }
});

// Endpoint to download the ZIP file
app.get('/download', (req, res) => {
    const zipPath = path.join(__dirname, 'scraped_data.zip');
    res.download(zipPath, 'scraped_data.zip', (err) => {
        if (err) {
            console.error(err);
        } else {
            fs.unlinkSync(zipPath); // Clean up ZIP file after download
        }
    });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

