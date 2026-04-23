const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./questions.db');

db.all(`SELECT * FROM questions ORDER BY id`, [], (err, rows) => {
    if (err) return console.error(err);

    db.serialize(() => {
        const stmt = db.prepare(`UPDATE questions SET 
            type = ?, 
            opt1 = ?, opt2 = ?, opt3 = ?, opt4 = ?, 
            opt1_image_url = ?, opt2_image_url = ?, opt3_image_url = ?, opt4_image_url = ?,
            correct_idx = ?
            WHERE id = ?`);

        let imageCount = 0;
        let textCount = 0;
        let booleanCount = 0;
        let imgTextCount = 0;

        rows.forEach(q => {
            let newType = 'text';
            let opt1 = q.opt1, opt2 = q.opt2, opt3 = q.opt3, opt4 = q.opt4;
            let opt1Img = q.opt1_image_url, opt2Img = q.opt2_image_url, opt3Img = q.opt3_image_url, opt4Img = q.opt4_image_url;
            let correct_idx = q.correct_idx;

            if (imageCount < 40) {
                newType = 'image';
                imageCount++;
                // Force exactly 2 image options, clear text
                opt1 = null; opt2 = null; opt3 = null; opt4 = null;
                // If they don't have image URLs, they will be empty strings or null. Frontend will use placeholder.
                opt3Img = null; opt4Img = null; 
                // Ensure correct_idx is 0 or 1
                correct_idx = correct_idx % 2;
            } else if (textCount < 20) {
                newType = 'text';
                textCount++;
            } else if (booleanCount < 20) {
                newType = 'boolean';
                booleanCount++;
                opt1 = '正确';
                opt2 = '错误';
                opt3 = null;
                opt4 = null;
                correct_idx = correct_idx % 2;
                opt1Img = null; opt2Img = null; opt3Img = null; opt4Img = null;
            } else if (imgTextCount < 20) {
                newType = 'img-text';
                imgTextCount++;
            } else {
                newType = 'text';
            }

            stmt.run([
                newType,
                opt1, opt2, opt3, opt4,
                opt1Img, opt2Img, opt3Img, opt4Img,
                correct_idx,
                q.id
            ]);
        });
        stmt.finalize();
        console.log("Database updated successfully to match 40/20/20/20 ratio.");
    });
});
