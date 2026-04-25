const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const db = new sqlite3.Database('./questions.db');

const PUBLIC_DIR = path.join(__dirname, 'public');

function checkFileExists(url) {
    if (!url) return true; // skip nulls
    
    // Some urls might start with '/' e.g. '/images/...'
    let filePath = url.startsWith('/') ? url.substring(1) : url;
    let absolutePath = path.join(PUBLIC_DIR, filePath);
    
    return fs.existsSync(absolutePath);
}

db.all('SELECT * FROM questions', [], (err, rows) => {
    if (err) throw err;
    let toDelete = [];
    
    rows.forEach(q => {
        let isBroken = false;
        
        const imgFields = ['image_url', 'opt1_image_url', 'opt2_image_url', 'opt3_image_url', 'opt4_image_url'];
        
        for (let field of imgFields) {
            if (q[field] && !checkFileExists(q[field])) {
                console.log(`Question ID ${q.id} has broken image in ${field}: ${q[field]}`);
                isBroken = true;
                break;
            }
        }
        
        if (isBroken) {
            toDelete.push(q.id);
        }
    });
    
    if (toDelete.length > 0) {
        console.log(`Found ${toDelete.length} questions with broken images. Deleting...`);
        const placeholders = toDelete.map(() => '?').join(',');
        db.run(`DELETE FROM questions WHERE id IN (${placeholders})`, toDelete, function(err) {
            if (err) throw err;
            console.log(`Deleted ${this.changes} questions with broken images.`);
        });
    } else {
        console.log('No questions with broken images found.');
    }
});
