const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3005;

function hashPassword(pwd) {
    return crypto.createHash('sha256').update(pwd).digest('hex');
}

// In-memory valid tokens
const validTokens = new Set();

// Auth Middleware
const requireAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    const token = authHeader.split(' ')[1];
    if (!validTokens.has(token)) {
        return res.status(401).json({ error: "Unauthorized or token expired" });
    }
    next();
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serve frontend
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve uploaded images

// Ensure uploads folder exists
if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
    fs.mkdirSync(path.join(__dirname, 'uploads'));
}

// Multer storage for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads/')),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Database setup
const db = new sqlite3.Database('./questions.db', (err) => {
    if (err) console.error(err.message);
    else console.log('Connected to the SQLite database.');
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT,
        question_text TEXT,
        image_description TEXT,
        image_url TEXT,
        opt1 TEXT, opt1_image_desc TEXT, opt1_image_url TEXT,
        opt2 TEXT, opt2_image_desc TEXT, opt2_image_url TEXT,
        opt3 TEXT, opt3_image_desc TEXT, opt3_image_url TEXT,
        opt4 TEXT, opt4_image_desc TEXT, opt4_image_url TEXT,
        correct_idx INTEGER,
        explanation TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_name TEXT,
        score INTEGER,
        time_taken INTEGER,
        create_time DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS ad_config (
        id INTEGER PRIMARY KEY,
        image_url TEXT,
        link_url TEXT,
        is_enabled INTEGER DEFAULT 0,
        qr_code_url TEXT,
        click_action_type TEXT DEFAULT 'link',
        popup_qr_url TEXT,
        popup_text TEXT DEFAULT '扫码打开小程序，免费鉴宝'
    )`, () => {
        db.run(`ALTER TABLE ad_config ADD COLUMN qr_code_url TEXT`, () => {}); // Ignore error if already exists
        db.run(`ALTER TABLE ad_config ADD COLUMN click_action_type TEXT DEFAULT 'link'`, () => {}); 
        db.run(`ALTER TABLE ad_config ADD COLUMN popup_qr_url TEXT`, () => {}); 
        db.run(`ALTER TABLE ad_config ADD COLUMN popup_text TEXT DEFAULT '扫码打开小程序，免费鉴宝'`, () => {}); 
        db.get(`SELECT COUNT(*) as count FROM ad_config`, [], (err, row) => {
            if (row && row.count === 0) {
                db.run(`INSERT INTO ad_config (id, image_url, link_url, is_enabled, qr_code_url) VALUES (1, '', '', 0, '')`);
            }
        });
    });

    db.run(`CREATE TABLE IF NOT EXISTS admin_auth (
        id INTEGER PRIMARY KEY,
        username TEXT UNIQUE,
        password_hash TEXT
    )`, () => {
        db.get(`SELECT COUNT(*) as count FROM admin_auth`, [], (err, row) => {
            if (row && row.count === 0) {
                const defaultHash = hashPassword('admin123');
                db.run(`INSERT INTO admin_auth (id, username, password_hash) VALUES (1, 'admin', ?)`, [defaultHash]);
            }
        });
    });
});

// APIs

// 1. Get 20 random questions for the test
app.get('/api/questions/random', (req, res) => {
    db.all(`SELECT * FROM questions`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const shuffle = (arr) => arr.sort(() => 0.5 - Math.random());
        
        let images = shuffle(rows.filter(q => q.type === 'image'));
        let texts = shuffle(rows.filter(q => q.type === 'text'));
        let booleans = shuffle(rows.filter(q => q.type === 'boolean'));
        let imgTexts = shuffle(rows.filter(q => q.type === 'img-text'));
        
        let result = [
            ...images.slice(0, 8),
            ...texts.slice(0, 4),
            ...booleans.slice(0, 4),
            ...imgTexts.slice(0, 4)
        ];
        
        if (result.length < 20) {
            let usedIds = new Set(result.map(q => q.id));
            let remaining = shuffle(rows.filter(q => !usedIds.has(q.id)));
            result = [...result, ...remaining.slice(0, 20 - result.length)];
        }
        
        res.json(shuffle(result));
    });
});

// 2. Get all questions (for admin)
app.get('/api/questions', (req, res) => {
    db.all(`SELECT * FROM questions ORDER BY id`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/do_seed', (req, res) => {
    const fs = require('fs');
    try {
        const fileContent = fs.readFileSync('d:\\回流工作\\AI-翡翠答题\\参考题目和题型\\js\\questions.js', 'utf8');
        let questions = [];
        const codeToEval = fileContent.replace('const questions =', 'questions =').replace(/function getFullQuestion[\\s\\S]*$/, '');
        eval(codeToEval);

        db.serialize(() => {
            db.run("DELETE FROM questions");
            const stmt = db.prepare(`INSERT INTO questions (
                type, question_text, image_url,
                opt1, opt1_image_url, opt2, opt2_image_url,
                opt3, opt3_image_url, opt4, opt4_image_url,
                correct_idx, explanation
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

            questions.forEach(q => {
                let type = q.type || 'text';
                let qImg = q.questionImg ? q.questionImg.replace('js/question_img/', '/images/question_img/') : null;
                let opt1 = q.opts && q.opts[0] ? q.opts[0] : null;
                let opt2 = q.opts && q.opts[1] ? q.opts[1] : null;
                let opt3 = q.opts && q.opts[2] ? q.opts[2] : null;
                let opt4 = q.opts && q.opts[3] ? q.opts[3] : null;
                let opt1Img = q.optionImgs && q.optionImgs[0] ? q.optionImgs[0].replace('js/question_img/', '/images/question_img/').replace('images/', '/images/') : null;
                let opt2Img = q.optionImgs && q.optionImgs[1] ? q.optionImgs[1].replace('js/question_img/', '/images/question_img/').replace('images/', '/images/') : null;
                let opt3Img = q.optionImgs && q.optionImgs[2] ? q.optionImgs[2].replace('js/question_img/', '/images/question_img/').replace('images/', '/images/') : null;
                let opt4Img = q.optionImgs && q.optionImgs[3] ? q.optionImgs[3].replace('js/question_img/', '/images/question_img/').replace('images/', '/images/') : null;

                stmt.run([type, q.q, qImg, opt1, opt1Img, opt2, opt2Img, opt3, opt3Img, opt4, opt4Img, q.a, q.expl]);
            });
            stmt.finalize();
            res.json({ message: 'Seeded ' + questions.length + ' questions successfully' });
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 3. Update question (admin edit)
app.put('/api/questions/:id', requireAuth, (req, res) => {
    const id = req.params.id;
    const q = req.body;
    db.run(`UPDATE questions SET 
        type = ?, question_text = ?, image_description = ?, image_url = ?,
        opt1 = ?, opt1_image_desc = ?, opt1_image_url = ?,
        opt2 = ?, opt2_image_desc = ?, opt2_image_url = ?,
        opt3 = ?, opt3_image_desc = ?, opt3_image_url = ?,
        opt4 = ?, opt4_image_desc = ?, opt4_image_url = ?,
        correct_idx = ?, explanation = ?
        WHERE id = ?`, 
        [q.type, q.question_text, q.image_description, q.image_url,
         q.opt1, q.opt1_image_desc, q.opt1_image_url,
         q.opt2, q.opt2_image_desc, q.opt2_image_url,
         q.opt3, q.opt3_image_desc, q.opt3_image_url,
         q.opt4, q.opt4_image_desc, q.opt4_image_url,
         q.correct_idx, q.explanation, id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Question updated', changes: this.changes });
        });
});

// Create new empty question (admin create)
app.post('/api/questions', requireAuth, (req, res) => {
    db.run(`INSERT INTO questions (type, question_text, correct_idx) VALUES ('text', '新题目，请编辑题干', 0)`, [], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Question created', id: this.lastID });
    });
});

// Delete question (admin delete)
app.delete('/api/questions/:id', requireAuth, (req, res) => {
    const id = req.params.id;
    db.run(`DELETE FROM questions WHERE id = ?`, [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Question deleted', changes: this.changes });
    });
});

// 4. Upload image
app.post('/api/upload', requireAuth, upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No image uploaded" });
    res.json({ image_url: '/uploads/' + req.file.filename });
});

// 5. Submit test record
app.post('/api/records', (req, res) => {
    const { user_name, score, time_taken } = req.body;
    db.run(`INSERT INTO records (user_name, score, time_taken) VALUES (?, ?, ?)`, 
    [user_name || 'Anonymous', score, time_taken], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Record saved', record_id: this.lastID });
    });
});

// 6. Get records (for admin)
app.get('/api/records', (req, res) => {
    db.all(`SELECT * FROM records ORDER BY create_time DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 7. Ad Config APIs
app.get('/api/ad-config', (req, res) => {
    db.get(`SELECT * FROM ad_config WHERE id = 1`, [], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row || { 
            image_url: '', link_url: '', is_enabled: 0, qr_code_url: '',
            click_action_type: 'link', popup_qr_url: '', popup_text: '扫码打开小程序，免费鉴宝'
        });
    });
});

app.post('/api/ad-config', requireAuth, (req, res) => {
    const { image_url, link_url, is_enabled, qr_code_url, click_action_type, popup_qr_url, popup_text } = req.body;
    db.run(`UPDATE ad_config SET image_url = ?, link_url = ?, is_enabled = ?, qr_code_url = ?, click_action_type = ?, popup_qr_url = ?, popup_text = ? WHERE id = 1`, 
    [image_url, link_url, is_enabled ? 1 : 0, qr_code_url, click_action_type || 'link', popup_qr_url, popup_text || '扫码打开小程序，免费鉴宝'], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Ad config updated', changes: this.changes });
    });
});

// 8. Auth APIs
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get(`SELECT * FROM admin_auth WHERE username = ?`, [username], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row || row.password_hash !== hashPassword(password)) {
            return res.status(401).json({ error: "账号或密码错误" });
        }
        const token = crypto.randomBytes(32).toString('hex');
        validTokens.add(token);
        res.json({ message: "Login successful", token });
    });
});

app.post('/api/change-password', requireAuth, (req, res) => {
    const { oldPassword, newPassword } = req.body;
    db.get(`SELECT * FROM admin_auth WHERE username = 'admin'`, [], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row || row.password_hash !== hashPassword(oldPassword)) {
            return res.status(401).json({ error: "旧密码错误" });
        }
        db.run(`UPDATE admin_auth SET password_hash = ? WHERE username = 'admin'`, [hashPassword(newPassword)], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            // Invalidate all tokens on password change
            validTokens.clear();
            res.json({ message: "Password updated successfully" });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
