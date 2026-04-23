const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./questions.db');

const replacementPool = [
    { type: 'image', q: "哪张图片展示了常被用作男士戒指面的“马鞍戒”？", opt1: null, opt2: null, opt3: null, opt4: null, desc1: "呈长方形，表面带弧度的马鞍形状戒面", desc2: "标准的正圆形蛋面", a: 0 },
    { type: 'image', q: "哪张图片展示了寓意“节节高升”的“竹节”题材挂件？", opt1: null, opt2: null, opt3: null, opt4: null, desc1: "雕刻成竹子一节一节形状的挂件", desc2: "雕刻成树叶形状的挂件", a: 0 },
    { type: 'image', q: "哪张图展示的是翡翠雕刻中常见的“如意”题材？", opt1: null, opt2: null, opt3: null, opt4: null, desc1: "头部类似灵芝或祥云形状的传统如意雕件", desc2: "雕刻成圆形平安扣的素面件", a: 0 },
    { type: 'image', q: "对比两图，哪一张展示的是“镶嵌”工艺的翡翠戒指？", opt1: null, opt2: null, opt3: null, opt4: null, desc1: "周围镶满了碎钻的K金翡翠戒指", desc2: "一整块翡翠打磨成的素面扳指", a: 0 },
    { type: 'image', q: "哪张图片展示的是翡翠摆件中常见的“白菜”（百财）题材？", opt1: null, opt2: null, opt3: null, opt4: null, desc1: "雕刻成大白菜形状的精美摆件", desc2: "雕刻成弥勒佛形状的摆件", a: 0 },
    { type: 'text', q: "在翡翠鉴定中，常常提到“水头”，这指的是翡翠的什么特征？", opt1: "透明度", opt2: "颜色深度", opt3: "重量", opt4: "硬度", desc1: null, desc2: null, a: 0 },
    { type: 'text', q: "购买翡翠手镯时，俗称的“条宽”是指手镯的哪个部分？", opt1: "内圈的直径", opt2: "手镯环体表面的宽度", opt3: "手镯环体的厚度", opt4: "手镯的总重量", desc1: null, desc2: null, a: 1 },
    { type: 'text', q: "“人养玉三年，玉养人一生”，在日常佩戴中，人体分泌的油脂会对天然翡翠产生什么影响？", opt1: "使翡翠变得更干", opt2: "在表面形成微小包浆，显得更润泽", opt3: "会导致翡翠褪色", opt4: "会使翡翠内部裂纹愈合", desc1: null, desc2: null, a: 1 },
    { type: 'text', q: "翡翠鉴定证书上标明的“折射率”通常是在哪个数值附近？", opt1: "1.54", opt2: "1.61", opt3: "1.66", opt4: "1.76", desc1: null, desc2: null, a: 2 },
    { type: 'text', q: "翡翠雕件中常见的“貔貅”题材，在传统文化中主要寓意什么？", opt1: "长命百岁", opt2: "早生贵子", opt3: "招财进宝", opt4: "步步高升", desc1: null, desc2: null, a: 2 },
    { type: 'text', q: "关于佩戴翡翠的保养，以下哪项是错误的？", opt1: "避免与硬物碰撞", opt2: "可以经常用高温热水清洗以杀菌", opt3: "长时间不佩戴应定期泡水补充水分", opt4: "避免接触强酸强碱", desc1: null, desc2: null, a: 1 },
    { type: 'text', q: "翡翠的“底”通常指的是什么？", opt1: "翡翠的背面", opt2: "除去颜色之外的部分，即质地、透明度和净度的综合", opt3: "翡翠的产地", opt4: "翡翠最初的形态", desc1: null, desc2: null, a: 1 }
];

db.serialize(() => {
    db.all("SELECT id, type, question_text FROM questions WHERE question_text LIKE '%原石%' OR question_text LIKE '%皮壳%' OR question_text LIKE '%开窗%' OR question_text LIKE '%松花%' OR question_text LIKE '%黑乌沙%' OR question_text LIKE '%蟒带%'", [], (err, rows) => {
        if (err) return console.error(err);
        
        if (rows.length === 0) {
            console.log("No rough stone questions found.");
            return;
        }

        const stmt = db.prepare(`UPDATE questions SET 
            question_text = ?, 
            opt1 = ?, opt2 = ?, opt3 = ?, opt4 = ?,
            opt1_image_desc = ?, opt2_image_desc = ?,
            correct_idx = ?
            WHERE id = ?`);

        let replacementIndex = 0;
        rows.forEach((row) => {
            // Find a replacement of the SAME type if possible
            let newQ = replacementPool.find(r => r.type === row.type && !r.used);
            if (!newQ) {
                newQ = replacementPool.find(r => !r.used) || replacementPool[0]; 
            }
            if (newQ) {
                newQ.used = true;
                
                if (row.type === 'image') {
                    stmt.run([newQ.q, null, null, null, null, newQ.desc1 || "替换选项1", newQ.desc2 || "替换选项2", newQ.a, row.id]);
                } else if (row.type === 'text' || row.type === 'img-text') {
                    stmt.run([newQ.q, newQ.opt1 || "选项1", newQ.opt2 || "选项2", newQ.opt3 || "选项3", newQ.opt4 || "选项4", null, null, newQ.a, row.id]);
                } else if (row.type === 'boolean') {
                    stmt.run([newQ.q + "这个说法是正确的。", "正确", "错误", null, null, null, null, newQ.a, row.id]);
                }
            }
        });
        
        stmt.finalize();
        console.log(`Successfully replaced ${rows.length} rough stone questions with finished jade questions.`);
    });
});
