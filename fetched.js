const axios = require('axios');
const fs = require('fs');

async function fetchAllCityCoordinates() {
  const sqlUrl = 'https://raw.githubusercontent.com/aslamanver/srilanka-cities/refs/heads/master/cities.sql';
  const result = {};

  try {
    const response = await axios.get(sqlUrl);
    const sqlData = response.data;

    // Match all rows in the SQL VALUES section
    const rowRegex = /\(([^)]+)\)/g;
    let match;
    let id = 1;

    while ((match = rowRegex.exec(sqlData)) !== null) {
      const row = match[1].split(',');

      const name_en = row[2]?.trim().replace(/^'/, '').replace(/'$/, '').toLowerCase();
      const latitude = parseFloat(row[row.length - 2]);
      const longitude = parseFloat(row[row.length - 1]);

      if (name_en) {
        let key = name_en;
        while (result[key]) {
          key = `${name_en}_${id++}`;
        }
        result[key] = { latitude, longitude };
      }
    }

    fs.writeFileSync('fetched.json', JSON.stringify(result, null, 2));
    console.log(`✅ Saved ${Object.keys(result).length} city coordinates to fetched.json`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fetchAllCityCoordinates();
