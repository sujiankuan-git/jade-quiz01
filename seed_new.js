const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const db = new sqlite3.Database('./questions.db');

// Read questions.js
const fileContent = fs.readFileSync('d:\\回流工作\\AI-翡翠答题\\参考题目和题型\\js\\questions.js', 'utf8');

// Strip out "const questions = " and the trailing function to get pure JSON/JS array.
// But it's easier to just eval it. We can mock a module.
let questions = [];
try {
    const codeToEval = fileContent.replace('const questions =', 'questions =').replace(/function getFullQuestion[\s\S]*$/, '');
    eval(codeToEval); // This will populate the 'questions' variable
} catch (e) {
    console.error("Error parsing questions.js:", e);
    process.exit(1);
}

console.log("Parsed", questions.length, "questions from reference file.");

db.serialize(() => {
    // We clear existing questions or just append? 
    // The user said "每次随机抽取20个", let's clear and re-insert the 100 (or however many) questions to ensure clean state with images.
    db.run("DELETE FROM questions");

    const stmt = db.prepare(`INSERT INTO questions (
        type, question_text, image_url,
        opt1, opt1_image_url,
        opt2, opt2_image_url,
        opt3, opt3_image_url,
        opt4, opt4_image_url,
        correct_idx, explanation
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

    questions.forEach(q => {
        let type = q.type || 'text';
        let qText = q.q;
        // Fix image paths: 'js/question_img/...' -> '/images/question_img/...'
        let qImg = q.questionImg ? q.questionImg.replace('js/question_img/', '/images/question_img/') : null;
        
        let opt1 = q.opts && q.opts[0] ? q.opts[0] : null;
        let opt2 = q.opts && q.opts[1] ? q.opts[1] : null;
        let opt3 = q.opts && q.opts[2] ? q.opts[2] : null;
        let opt4 = q.opts && q.opts[3] ? q.opts[3] : null;
        
        let opt1Img = q.optionImgs && q.optionImgs[0] ? q.optionImgs[0].replace('js/question_img/', '/images/question_img/').replace('images/', '/images/') : null;
        let opt2Img = q.optionImgs && q.optionImgs[1] ? q.optionImgs[1].replace('js/question_img/', '/images/question_img/').replace('images/', '/images/') : null;
        let opt3Img = q.optionImgs && q.optionImgs[2] ? q.optionImgs[2].replace('js/question_img/', '/images/question_img/').replace('images/', '/images/') : null;
        let opt4Img = q.optionImgs && q.optionImgs[3] ? q.optionImgs[3].replace('js/question_img/', '/images/question_img/').replace('images/', '/images/') : null;

        stmt.run([
            type, qText, qImg,
            opt1, opt1Img,
            opt2, opt2Img,
            opt3, opt3Img,
            opt4, opt4Img,
            q.a, q.expl
        ]);
    });

    stmt.finalize();
    console.log("Successfully inserted questions into the database.");
});

db.close();
