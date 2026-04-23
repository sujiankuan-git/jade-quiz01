const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./questions.db');

const fixes = [
    {
        keyword: "马鞍戒",
        imgTextQ: "观察上方的图片，这件男士翡翠戒指属于什么款式？",
        textQ: "翡翠男戒中，有一种款式呈长方形，表面带微弧度，形似马背上的鞍，这种款式叫什么？",
        opts: ["马鞍戒", "扳指", "蛋面戒指", "素圈戒指"],
        a: 0,
        imgDesc: "一张男士佩戴马鞍戒的高清图",
        expl: "马鞍戒是传统的男士戒指款式，形似马鞍，寓意平安通顺。"
    },
    {
        keyword: "竹节",
        imgTextQ: "观察图片，这件翡翠挂件雕刻的是什么传统题材？寓意节节高升。",
        textQ: "翡翠挂件中，常有一种雕刻成一节一节形状的题材，寓意“步步高升”、“青春永驻”，这是什么题材？",
        opts: ["竹节", "树叶", "如意", "福瓜"],
        a: 0,
        imgDesc: "一张雕刻精美的翡翠竹节挂件图",
        expl: "竹子是一节一节生长的，因此竹节题材在翡翠中寓意着事业或学业节节高升。"
    },
    {
        keyword: "如意",
        imgTextQ: "上图展示的翡翠雕件，其头部类似灵芝或祥云，这是什么传统题材？",
        textQ: "翡翠雕件中，有一种造型的头部类似灵芝或祥云，寓意“万事顺心”，这是什么题材？",
        opts: ["如意", "平安扣", "无事牌", "路路通"],
        a: 0,
        imgDesc: "一张传统翡翠如意挂件的高清图",
        expl: "如意是中国传统的吉祥之物，造型多取自灵芝或祥云，寓意万事如意。"
    },
    {
        keyword: "镶嵌",
        imgTextQ: "上图这枚翡翠戒指在制作工艺上采用了哪种方式来固定蛋面？",
        textQ: "为了保护高档翡翠蛋面并增加其豪华感，通常会使用K金和钻石将其固定在戒指或吊坠上，这种工艺叫什么？",
        opts: ["K金镶嵌", "整体打磨", "镂空雕刻", "浮雕"],
        a: 0,
        imgDesc: "一张豪华K金镶钻的翡翠蛋面戒指图",
        expl: "镶嵌工艺利用金属的延展性将翡翠包裹或固定，是现代高级珠宝最常用的工艺。"
    },
    {
        keyword: "白菜",
        imgTextQ: "图片中的翡翠摆件雕刻成了蔬菜的形状，因为谐音“百财”，深受商人喜爱，这是什么题材？",
        textQ: "翡翠摆件中，有一种蔬菜题材因为谐音“百财”、“摆财”，寓意招财进宝，这是什么？",
        opts: ["白菜", "萝卜", "葫芦", "麦穗"],
        a: 0,
        imgDesc: "一张精美的翡翠白菜摆件图（如台北故宫翠玉白菜的类似款式）",
        expl: "白菜谐音“百财”，寓意聚财、招财、发财，是翡翠摆件中的经典题材。"
    }
];

db.serialize(() => {
    db.all("SELECT id, type, question_text FROM questions WHERE question_text LIKE '%马鞍戒%' OR question_text LIKE '%竹节%' OR question_text LIKE '%如意%' OR question_text LIKE '%镶嵌%' OR question_text LIKE '%白菜%'", [], (err, rows) => {
        if (err) return console.error(err);
        
        const stmt = db.prepare(`UPDATE questions SET 
            question_text = ?, 
            opt1 = ?, opt2 = ?, opt3 = ?, opt4 = ?,
            opt1_image_desc = null, opt2_image_desc = null, opt3_image_desc = null, opt4_image_desc = null,
            image_description = ?, correct_idx = ?, explanation = ?
            WHERE id = ?`);

        let updated = 0;
        rows.forEach((row) => {
            const fix = fixes.find(f => row.question_text.includes(f.keyword));
            if (fix) {
                if (row.type === 'img-text') {
                    stmt.run([fix.imgTextQ, fix.opts[0], fix.opts[1], fix.opts[2], fix.opts[3], fix.imgDesc, fix.a, fix.expl, row.id]);
                    updated++;
                } else if (row.type === 'text') {
                    stmt.run([fix.textQ, fix.opts[0], fix.opts[1], fix.opts[2], fix.opts[3], null, fix.a, fix.expl, row.id]);
                    updated++;
                } else if (row.type === 'image') {
                    // These shouldn't be image type since they were used as replacements, but if they are, they are okay as is because my previous script matched them correctly.
                    // Wait, if it IS image type, the text "哪张图片展示了..." IS correct! The user's complaint "他不是适合作为一个图文选择题出现" implies it currently IS a text or img-text type in the DB but has the text of an image type!
                    // If it actually IS an image type, then the user's complaint means: "Wait, the admin panel says it's an img-text question!"
                    // Let's just fix it if it's text or img-text. If it's image, leave it alone.
                }
            }
        });
        
        stmt.finalize();
        console.log(`Successfully fixed ${updated} mismatched questions.`);
    });
});
