const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./questions.db');

db.all(`SELECT type, COUNT(*) as count FROM questions GROUP BY type`, [], (err, rows) => {
    if (err) return console.error(err);
    console.log("Original Types Breakdown:");
    console.table(rows);
});
