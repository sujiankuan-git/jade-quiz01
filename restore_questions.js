const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const db = new sqlite3.Database('./questions.db');

const fileContent = fs.readFileSync('./fix_image_questions.js', 'utf8');
const startIdx = fileContent.indexOf('const imageQuestions =') + 'const imageQuestions ='.length;
const endIdx = fileContent.indexOf('];', startIdx) + 1;
const arrayString = fileContent.substring(startIdx, endIdx);

const imageQuestions = eval(arrayString);

db.all("SELECT question_text FROM questions WHERE type = 'image'", [], (err, rows) => {
    const existingTexts = new Set(rows.map(r => r.question_text));
    
    const toInsert = imageQuestions.filter(q => !existingTexts.has(q.q) && !q.q.includes('水头'));
    
    if (toInsert.length > 0) {
        db.serialize(() => {
            const stmt = db.prepare(`INSERT INTO questions (type, question_text, opt1_image_desc, opt2_image_desc, correct_idx) VALUES ('image', ?, ?, ?, ?)`);
            toInsert.forEach(q => {
                stmt.run([q.q, q.desc1, q.desc2, q.a]);
            });
            stmt.finalize();
            console.log(`Restored ${toInsert.length} image questions.`);
        });
    } else {
        console.log("No missing image questions found to restore.");
    }
});
