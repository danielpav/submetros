const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3003;

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Route to list GeoJSON files
app.get('/geojson-files', (req, res) => {
    const geojsonDir = path.join(__dirname, 'public', 'geojson');
    fs.readdir(geojsonDir, (err, files) => {
        if (err) {
            res.status(500).send('Unable to scan directory');
        } else {
            const geojsonFiles = files.filter(file => file.endsWith('.geojson'));
            res.json(geojsonFiles);
        }
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
