const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./questions.db');

db.all("SELECT id, question_text FROM questions WHERE type = 'image'", [], (err, rows) => {
    if (err) throw err;
    const seen = new Map();
    const duplicates = [];

    rows.forEach(row => {
        const text = row.question_text.trim();
        if (seen.has(text)) {
            duplicates.push(row.id);
            console.log(`Found duplicate: ID ${row.id} -> "${text}" (Original ID: ${seen.get(text)})`);
        } else {
            seen.set(text, row.id);
        }
    });

    if (duplicates.length > 0) {
        console.log(`Found ${duplicates.length} duplicates. Deleting...`);
        const placeholders = duplicates.map(() => '?').join(',');
        db.run(`DELETE FROM questions WHERE id IN (${placeholders})`, duplicates, function(err) {
            if (err) throw err;
            console.log(`Deleted ${this.changes} duplicate questions.`);
        });
    } else {
        console.log("No duplicate image questions found.");
    }
});
