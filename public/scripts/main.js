document.getElementById('scrapeForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const url = document.getElementById('url').value;
    const downloadZip = document.getElementById('downloadZip').checked;

    const response = await fetch('/scrape', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url, downloadZip })
    });

    if (response.ok) {
        const { screenshotUrl, results, zipUrl } = await response.json();

        const screenshotImg = document.getElementById('screenshot');
        screenshotImg.src = screenshotUrl;
        screenshotImg.style.display = 'block';

        const resultTextarea = document.getElementById('result');
        resultTextarea.value = `HTML:\n${results.html}\n\nCSS Files:\n${results.cssFiles.join('\n')}\n\nJS Files:\n${results.jsFiles.join('\n')}\n\nCookies:\n${results.cookies}`;

        const downloadLink = document.getElementById('downloadLink');
        if (downloadZip) {
            downloadLink.href = zipUrl;
            downloadLink.style.display = 'inline';
        } else {
            downloadLink.style.display = 'none';
        }
    } else {
        const errorText = await response.text();
        document.getElementById('result').textContent = `Error: ${errorText}`;
    }
});

