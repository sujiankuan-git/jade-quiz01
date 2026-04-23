const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./questions.db');

db.all(`SELECT * FROM questions ORDER BY id`, [], (err, rows) => {
    if (err) return console.error(err);

    // Current counts: image:24, img-text:16, text:60, boolean:0
    // Target counts: image:40, img-text:20, text:20, boolean:20
    
    // We need to convert:
    // 16 text -> image
    // 4 text -> img-text
    // 20 text -> boolean
    // The remaining 20 text -> stay text

    let convertedToImage = 0;
    let convertedToImgText = 0;
    let convertedToBoolean = 0;

    db.serialize(() => {
        const stmt = db.prepare(`UPDATE questions SET 
            type = ?, 
            question_text = ?,
            opt1 = ?, opt2 = ?, opt3 = ?, opt4 = ?, 
            opt1_image_url = ?, opt2_image_url = ?, opt3_image_url = ?, opt4_image_url = ?,
            correct_idx = ?
            WHERE id = ?`);

        rows.forEach(q => {
            let newType = q.type;
            let qText = q.question_text;
            let opt1 = q.opt1, opt2 = q.opt2, opt3 = q.opt3, opt4 = q.opt4;
            let opt1Img = q.opt1_image_url, opt2Img = q.opt2_image_url, opt3Img = q.opt3_image_url, opt4Img = q.opt4_image_url;
            let correct_idx = q.correct_idx;

            if (q.type === 'text') {
                if (convertedToImage < 16) {
                    newType = 'image';
                    convertedToImage++;
                    // Convert to 2-option image question. Leave text intact so user knows what to upload later.
                    // Actually, we'll just clear opt3 and opt4. Keep correct_idx.
                    opt3 = null; opt4 = null;
                    opt3Img = null; opt4Img = null;
                    correct_idx = correct_idx % 2;
                } else if (convertedToImgText < 4) {
                    newType = 'img-text';
                    convertedToImgText++;
                } else if (convertedToBoolean < 20) {
                    newType = 'boolean';
                    convertedToBoolean++;
                    
                    // Create a True/False statement
                    let correctAnsTxt = q[`opt${correct_idx + 1}`];
                    let wrongAnsTxt = q[`opt${((correct_idx + 1) % 4) + 1}`] || q.opt1;
                    if (wrongAnsTxt === correctAnsTxt) {
                         wrongAnsTxt = q.opt2 || '其他';
                    }
                    
                    let isTrue = Math.random() > 0.5;
                    let statement = qText + " 答案是：" + (isTrue ? correctAnsTxt : wrongAnsTxt);
                    
                    qText = statement;
                    opt1 = '正确';
                    opt2 = '错误';
                    opt3 = null;
                    opt4 = null;
                    correct_idx = isTrue ? 0 : 1;
                    opt1Img = null; opt2Img = null; opt3Img = null; opt4Img = null;
                }
            }

            stmt.run([
                newType,
                qText,
                opt1, opt2, opt3, opt4,
                opt1Img, opt2Img, opt3Img, opt4Img,
                correct_idx,
                q.id
            ]);
        });
        stmt.finalize();
        console.log("Database smart-updated successfully to match 40/20/20/20 ratio.");
    });
});
