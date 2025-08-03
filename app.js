const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

const hardcodedCities = JSON.parse(fs.readFileSync(path.join(__dirname, 'data.json'), 'utf-8'));

// Check if given lat/lon are within Sri Lanka
function isWithinSriLanka(lat, lon) {
  return lat >= 5.55 && lat <= 9.51 && lon >= 79.31 && lon <= 81.9;
}

// Find nearest city from lat/lon
function getNearestCity(lat, lon) {
  let nearestCity = null;
  let shortestDist = Infinity;

  for (const [city, coords] of Object.entries(hardcodedCities)) {
    const distance = Math.sqrt(
      Math.pow(coords.latitude - lat, 2) + Math.pow(coords.longitude - lon, 2)
    );
    if (distance < shortestDist) {
      shortestDist = distance;
      nearestCity = city;
    }
  }

  return nearestCity;
}

// Get coordinates by city name
function getCoordinatesByCity(city) {
  const entry = Object.entries(hardcodedCities).find(([name]) =>
    name.toLowerCase() === city.toLowerCase()
  );
  return entry ? { city: entry[0], coords: entry[1] } : null;
}

app.use(express.static('public'));

app.get('/api/prayerTimes', async (req, res) => {
  const { latitude, longitude, date, city } = req.query;
  const targetDate = date || new Date().toISOString().split('T')[0].split('-').reverse().join('-');

  // Method 1: by coordinates
  if (latitude && longitude) {
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (!isWithinSriLanka(lat, lon)) {
      return res.status(400).json({ error: 'Coordinates are outside Sri Lanka' });
    }

    const nearestCity = getNearestCity(lat, lon);
    const coords = hardcodedCities[nearestCity];

    try {
      const apiUrl = `https://api.aladhan.com/v1/timings/${targetDate}?latitude=${coords.latitude}&longitude=${coords.longitude}&method=3`;
      const response = await axios.get(apiUrl);
      res.json({ ...response.data, nearestCity });
    } catch {
      res.status(500).json({ error: 'Failed to fetch prayer times' });
    }

  // Method 2: by city name
  } else if (city) {
    const found = getCoordinatesByCity(city);
    if (!found) return res.status(404).json({ error: 'City not found' });

    const { coords } = found;

    try {
      const apiUrl = `https://api.aladhan.com/v1/timings/${targetDate}?latitude=${coords.latitude}&longitude=${coords.longitude}&method=3`;
      const response = await axios.get(apiUrl);
      res.json({ ...response.data, city: found.city });
    } catch {
      res.status(500).json({ error: 'Failed to fetch prayer times' });
    }

  } else {
    return res.status(400).json({ error: 'Provide either coordinates or city' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
