const fs = require('node:fs');
const path = require('node:path');
const db = require('../data/database');
async function main() {
  const sql = fs.readFileSync(path.join(__dirname, '../data/schema.sql'), 'utf8');
  for (const statement of sql.split(';').map(s => s.trim()).filter(Boolean)) await db.query(statement);
  for (const place of require('../data/places.json')) {
    await db.query('INSERT INTO places (name, description, image_path) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name)',
      [place.name, place.description, place.image_path]);
  }
  console.log('Demo tables and places are ready. Existing data was kept.');
}
main().catch(err => { console.error('Database setup failed:', err.code || err.name); process.exitCode = 1; }).finally(() => db.end());
