const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

// 1. Read seed.js and extract questionsData
let code = fs.readFileSync('seed.js', 'utf8');
const start = code.indexOf('const questionsData = [');
const end = code.indexOf('];', start);
const arrCode = code.substring(start + 22, end + 1);

// eval it safely
let questionsData = [];
eval('questionsData = ' + arrCode);

const expMap = {};
questionsData.forEach(q => {
    expMap[q.q] = q.e;
});

// 2. Read seed_new.js and add more
try {
  let code2 = fs.readFileSync('seed_new.js', 'utf8');
  let qArr = code2.match(/const questions = (\[[\s\S]*?\]);/);
  if(qArr) {
    let qs = [];
    eval('qs = ' + qArr[1]);
    qs.forEach(q => expMap[q.question_text] = q.explanation);
  }
} catch(e) {}

const db = new sqlite3.Database('questions.db');
db.all('SELECT id, question_text, explanation FROM questions', [], (err, rows) => {
    let updateQueries = [];
    rows.forEach(r => {
        const correctExp = expMap[r.question_text];
        if (correctExp && correctExp !== r.explanation) {
            updateQueries.push({id: r.id, exp: correctExp});
        }
    });
    
    console.log(`Found ${updateQueries.length} mismatched explanations.`);
    if(updateQueries.length > 0) {
        db.serialize(() => {
            db.run('BEGIN TRANSACTION');
            const stmt = db.prepare('UPDATE questions SET explanation = ? WHERE id = ?');
            updateQueries.forEach(u => stmt.run([u.exp, u.id]));
            stmt.finalize();
            db.run('COMMIT', (err) => {
                if(err) console.error(err);
                else console.log('Successfully fixed mismatches!');
            });
        });
    }
});
