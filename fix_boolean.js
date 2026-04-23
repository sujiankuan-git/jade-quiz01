const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./questions.db');

const trueFalseQuestions = [
    { q: "翡翠的硬度比和田玉高，在矿物学上属于“硬玉”。", a: 0, expl: "正确。翡翠硬度在6.5-7之间，比和田玉（软玉）更高。" },
    { q: "翡翠的“种”主要是指颜色的鲜艳程度。", a: 1, expl: "错误。“种”指的是翡翠的质地和矿物晶体的细腻程度，颜色称为“色”。" },
    { q: "“玻璃种”是翡翠中透明度最高、质地最细腻的种水等级。", a: 0, expl: "正确。玻璃种如玻璃般通透，是种水的天花板。" },
    { q: "翡翠只要是绿色的，不管透明度如何，价值就一定很高。", a: 1, expl: "错误。所谓“外行看色，内行看种”，没有种水的干青或铁龙生价值并不高。" },
    { q: "“水沫子”的密度和翡翠一样，因此很难通过掂重来分辨。", a: 1, expl: "错误。水沫子（钠长石玉）比重比翡翠小很多，上手感觉明显更轻。" },
    { q: "天然翡翠的翠绿色主要是由于内部含有“铬”元素致色。", a: 0, expl: "正确。铬元素是翡翠呈现鲜艳绿色的核心原因。" },
    { q: "在紫光灯照射下出现强烈荧光反应的翡翠，说明它是极品天然A货。", a: 1, expl: "错误。强荧光通常说明翡翠经过了注胶处理（B货或C货），A货通常无荧光或极弱。" },
    { q: "“危地马拉翡翠”（危料）在矿物学上也属于硬玉，所以能出具翡翠证书。", a: 0, expl: "正确。危料确实是硬玉，国检能出具翡翠证书，但市场价值通常低于缅甸翡翠。" },
    { q: "翡翠的“起莹”是一种光学现象，通常出现在种水极好、弧面切割的翡翠上。", a: 0, expl: "正确。起莹是光线在颗粒细腻的翡翠内部产生漫反射形成的光晕。" },
    { q: "用玛瑙棒敲击悬挂的翡翠手镯，声音越沉闷说明质地越好。", a: 1, expl: "错误。天然A货翡翠结构致密，敲击声音应该清脆悦耳，沉闷说明内部结构松散或有注胶。" },
    { q: "观察翡翠表面的“苍蝇翅”（解理面反光），是鉴定天然翡翠的重要特征之一。", a: 0, expl: "正确。翠性（苍蝇翅）是硬玉矿物的标志性物理特征。" },
    { q: "经过强酸浸泡洗去杂质，并注胶填充的翡翠，在行业内被称为“B货”。", a: 0, expl: "正确。洗底注胶是典型的B货处理手段。" },
    { q: "“帝王绿”是翡翠中颜色最为浓郁、纯正，且价值最高的绿色。", a: 0, expl: "正确。帝王绿绿得流油，是色彩评判的最高标准。" },
    { q: "翡翠的“石纹”和“裂纹”是同一种瑕疵，都会严重影响手镯的牢固度。", a: 1, expl: "错误。石纹是愈合的内裂，不抠手且不影响牢固度；裂纹未愈合，会影响寿命。" },
    { q: "目前市场上具有商业价值的宝石级翡翠，其产地绝对只有缅甸。", a: 1, expl: "错误。危地马拉也产出具有商业价值的宝石级翡翠，虽然主流仍以缅甸为尊。" },
    { q: "“飘花”是指翡翠内部呈现出丝状、点状或层状分布的色彩（如绿色或蓝色）。", a: 0, expl: "正确。飘花就像墨汁滴入水中散开的样子，非常具有意境美。" },
    { q: "翡翠手镯的圈口大小对价格没有任何影响，定价只看它的种水色。", a: 1, expl: "错误。大圈口（如60以上）更费原料，同等品质下大圈口通常比小圈口贵。" },
    { q: "购买翡翠时，只要证书上写着“翡翠”二字，它就绝对具有极高的收藏价值。", a: 1, expl: "错误。几十块钱的砖头料（如豆种粗豆）也是翡翠，但产量巨大，毫无收藏价值。" },
    { q: "翡翠内部的“棉”属于瑕疵，任何形式的棉都会导致翡翠大幅贬值。", a: 1, expl: "错误。有些特殊的棉（如木那雪花棉）如果分布有意境，反而会大幅提升翡翠的价值。" },
    { q: "“见光死”通常用来形容紫罗兰翡翠在室外自然强光下颜色变淡发白的现象。", a: 0, expl: "正确。紫罗兰翡翠由于颜色光谱原因，在不同光线下颜色反差极大。" }
];

db.serialize(() => {
    // Get the IDs of the 20 boolean questions currently in the DB
    db.all(`SELECT id FROM questions WHERE type = 'boolean' ORDER BY id`, [], (err, rows) => {
        if (err) return console.error(err);
        
        if (rows.length === 0) {
            console.log("No boolean questions found to update.");
            return;
        }

        const stmt = db.prepare(`UPDATE questions SET 
            question_text = ?, 
            opt1 = '正确', opt2 = '错误', opt3 = null, opt4 = null,
            correct_idx = ?, explanation = ?
            WHERE id = ?`);

        rows.forEach((row, index) => {
            if (index < trueFalseQuestions.length) {
                let newQ = trueFalseQuestions[index];
                stmt.run([newQ.q, newQ.a, newQ.expl, row.id]);
            }
        });
        
        stmt.finalize();
        console.log(`Successfully replaced ${rows.length} boolean questions with proper human-readable statements.`);
    });
});
