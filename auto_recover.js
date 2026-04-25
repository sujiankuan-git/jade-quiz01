const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const db = new sqlite3.Database('./questions.db');

const logOutput = `Question ID 1458 has broken image in opt1_image_url: /uploads/1776927461309-615893588.jpg
Question ID 1459 has broken image in opt1_image_url: /uploads/1776927708430-97729856.jpg
Question ID 1461 has broken image in opt1_image_url: /uploads/1776927741191-580008849.jpg
Question ID 1462 has broken image in opt1_image_url: /uploads/1776927846798-721489261.jpg
Question ID 1463 has broken image in opt1_image_url: /uploads/1776928117689-847818721.jpg
Question ID 1464 has broken image in image_url: /uploads/1776928232326-358850063.jpg
Question ID 1465 has broken image in opt1_image_url: /uploads/1776928782475-124748678.jpg
Question ID 1466 has broken image in opt1_image_url: /uploads/1776928702263-285579684.jpg
Question ID 1467 has broken image in opt1_image_url: /uploads/1776929271221-75177394.jpg
Question ID 1468 has broken image in opt1_image_url: /uploads/1776929441704-199003488.jpg
Question ID 1469 has broken image in image_url: /uploads/1776928323438-207131438.jpg
Question ID 1470 has broken image in opt1_image_url: /uploads/1776929490838-599394574.jpg
Question ID 1471 has broken image in opt1_image_url: /uploads/1776929570364-193879108.jpg
Question ID 1472 has broken image in opt1_image_url: /uploads/1776929588791-231414850.jpg
Question ID 1473 has broken image in opt1_image_url: /uploads/1776929780833-869259272.jpg
Question ID 1474 has broken image in image_url: /uploads/1776928390427-68801343.jpg
Question ID 1475 has broken image in opt1_image_url: /uploads/1776929900345-122168761.jpg
Question ID 1476 has broken image in opt1_image_url: /uploads/1776929631008-191555965.jpg
Question ID 1477 has broken image in opt1_image_url: /uploads/1776930024561-545143460.jpg
Question ID 1478 has broken image in opt1_image_url: /uploads/1776930949000-66602866.jpg
Question ID 1480 has broken image in opt1_image_url: /uploads/1776930970121-174799624.jpg
Question ID 1481 has broken image in opt1_image_url: /uploads/1776931024048-356868740.jpg
Question ID 1482 has broken image in opt1_image_url: /uploads/1776934472361-50430588.jpg
Question ID 1484 has broken image in opt1_image_url: /uploads/1776934513185-593890747.jpg
Question ID 1487 has broken image in image_url: /uploads/1776928544252-370454488.jpg
Question ID 1495 has broken image in opt1_image_url: /uploads/1776931059541-925958067.jpg
Question ID 1501 has broken image in opt1_image_url: /uploads/1776933983570-247297071.jpg
Question ID 1505 has broken image in opt1_image_url: /uploads/1776933811614-601030583.jpg
Question ID 1510 has broken image in opt1_image_url: /uploads/1776933082523-975509294.jpg
Question ID 1521 has broken image in opt1_image_url: /uploads/1776932616649-795462387.jpg
Question ID 1535 has broken image in opt1_image_url: /uploads/1776932903303-203067614.jpg
Question ID 1541 has broken image in opt1_image_url: /uploads/1776933065791-467438246.jpg
Question ID 1544 has broken image in opt1_image_url: /uploads/1776933747132-702934119.jpg
Question ID 1546 has broken image in opt1_image_url: /uploads/1776933627632-861838587.jpg
Question ID 1549 has broken image in opt1_image_url: /uploads/1776933504534-759181981.jpg
Question ID 1551 has broken image in opt1_image_url: /uploads/1776931091446-634975483.jpg
Question ID 1554 has broken image in opt1_image_url: /uploads/1776933118456-209117394.jpg
Question ID 1556 has broken image in opt1_image_url: /uploads/1776933145468-733887015.jpg`;

const oldMappings = [
  { "id": 1458, "question_text": "哪张图片展示了天然A货翡翠表面特有的“橘皮效应”？" },
  { "id": 1459, "question_text": "对比以下两件翡翠，哪件属于透明度更高的“玻璃种”？" },
  { "id": 1461, "question_text": "哪张图是质地细腻但透明度稍逊的“糯种”翡翠？" },
  { "id": 1462, "question_text": "请选出具有明显粗糙颗粒感的“豆种”翡翠。" },
  { "id": 1463, "question_text": "哪张图片展示的是价值连城的“帝王绿”翡翠？" },
  { "id": 1464, "question_text": "这件翡翠雕件属于以下哪种常见题材？" }, 
  { "id": 1465, "question_text": "哪一张图片展示的是带有明显黄绿色调的“苹果绿”？" },
  { "id": 1466, "question_text": "对比两图，哪一张是带有灰色调、沉稳内敛的“油青种”翡翠？" },
  { "id": 1467, "question_text": "哪张图片是在自然光下呈黑色，打灯透绿的“墨翠”？" },
  { "id": 1468, "question_text": "请选出表面具有强烈反光光晕（即“起莹”）的翡翠。" },
  { "id": 1469, "question_text": "观察图中这件玉器的颜色分布，它最可能是？" },
  { "id": 1470, "question_text": "哪张图展示了翡翠极品质地带来的“起胶”感（像流动的胶水）？" },
  { "id": 1471, "question_text": "哪一张图片展示的是名贵的“木那雪花棉”？" },
  { "id": 1472, "question_text": "鉴定翡翠的重要标志是“苍蝇翅”，哪张图展示了这一特征？" },
  { "id": 1473, "question_text": "和田玉籽料常带有天然皮色，哪张是名贵的“洒金皮”？" },
  { "id": 1474, "question_text": "图中所示的这种翡翠雕刻技法，最准确的称呼是？" },
  { "id": 1475, "question_text": "对比以下两种玉石的光泽，哪一张展现了和田玉特有的“油脂光泽”？" },
  { "id": 1476, "question_text": "“水沫子”常用来冒充翡翠，哪张图是典型的水沫子？" },
  { "id": 1477, "question_text": "危地马拉翡翠（危料）的绿色通常较闷，哪张图是危料？" },
  { "id": 1478, "question_text": "哪张图展示了经过人工染色的“C货”翡翠？" },
  { "id": 1480, "question_text": "“铁龙生”虽然满绿但水头极干，哪张图是铁龙生？" },
  { "id": 1481, "question_text": "请选出具有“飘花”特征（颜色呈丝状、云朵状散开）的手镯。" },
  { "id": 1482, "question_text": "“春带彩”是指一块翡翠上同时出现紫色和绿色，请选出春带彩手镯。" },
  { "id": 1484, "question_text": "对比两图，哪一张的种水更好，属于“细糯种”？" },
  { "id": 1485, "question_text": "哪张图展示的是严重影响翡翠牢固度的“裂纹”？" },
  { "id": 1487, "question_text": "图中的翡翠手镯，带有一种罕见且名贵的颜色，它是？" },
  { "id": 1490, "question_text": "打碎后的玉髓常呈现“贝壳状断口”，哪张图是贝壳状断口？" },
  { "id": 1495, "question_text": "哪张图片展示的是“黄翡”？" },
  { "id": 1501, "question_text": "哪一张图片展示的是冰糯种翡翠？" },
  { "id": 1505, "question_text": "独龙玉常被混淆为飘花翡翠，哪张图是含有绿色云母闪光的独龙玉？" },
  { "id": 1510, "question_text": "哪张图是被俗称为“天山翠”的石英岩玉手镯？" },
  { "id": 1515, "question_text": "对比两图，哪一张展示的是“镶嵌”工艺的翡翠戒指？" },
  { "id": 1521, "question_text": "哪张图片展示的是翡翠摆件中常见的“白菜”（百财）题材？" },
  { "id": 1525, "question_text": "雕刻工艺中，哪张图展示的是立体的“圆雕”工艺？" },
  { "id": 1530, "question_text": "抛光工艺对比：哪张图采用了“柔光（亚光）”抛光处理？" },
  { "id": 1535, "question_text": "哪张图片中的翡翠结构更加致密，属于典型的“老坑种”？" },
  { "id": 1541, "question_text": "哪张图片展示的是深受年轻女性喜爱的“白月光”手镯？" },
  { "id": 1544, "question_text": "器型对比：哪张图是“平安镯”（内圈平，外圈圆）？" },
  { "id": 1546, "question_text": "哪张图片展示的是呈椭圆形，适合手腕较扁人群佩戴的“贵妃镯”？" },
  { "id": 1549, "question_text": "哪张图展示的是以绿色呈平行丝状分布为特征的“金丝种”翡翠？" },
  { "id": 1551, "question_text": "传说中的极品“龙石种”翡翠，哪张图更符合其特征？" },
  { "id": 1554, "question_text": "鉴别墨翠：哪张图片展示的是打光后呈现出诱人绿色的正宗墨翠？" },
  { "id": 1556, "question_text": "哪张图是强调翡翠极简美学、不加过多雕饰的“素面（光身）”挂件？" }
];

// Get all files in uploads, sorted chronologically
const files = fs.readdirSync('./uploads')
    .filter(f => f.endsWith('.jpg') || f.endsWith('.png'))
    .sort();

db.all("SELECT id, type, question_text FROM questions", [], (err, currentQs) => {
    let updateQueries = [];
    
    const lines = logOutput.trim().split('\n');
    lines.forEach(line => {
        const match = line.match(/Question ID (\d+) has broken image in (opt1_image_url|image_url): \/uploads\/(.*\.jpg)/);
        if (match) {
            const oldId = parseInt(match[1]);
            const field = match[2];
            const file1 = match[3];
            
            // find question_text
            const oldMap = oldMappings.find(m => m.id === oldId);
            if (!oldMap) return;
            const qText = oldMap.question_text;
            
            // find new ID
            const newQ = currentQs.find(q => q.question_text === qText);
            if (!newQ) return;
            
            if (field === 'image_url') {
                updateQueries.push(`UPDATE questions SET image_url = '/uploads/${file1}' WHERE id = ${newQ.id}`);
            } else if (field === 'opt1_image_url') {
                // Find file1 in the sorted files array
                const idx = files.indexOf(file1);
                if (idx !== -1) {
                    const opt1 = `/uploads/${files[idx]}`;
                    
                    // The next file is likely opt2 if it's within a reasonable timeframe, but let's just assume it is opt2
                    // because the user uploaded pairs.
                    // Wait, sometimes they only uploaded 1 image?
                    // Let's check the prefix timestamp. 
                    const ts1 = parseInt(files[idx].split('-')[0]);
                    let opt2 = null;
                    if (idx + 1 < files.length) {
                        const ts2 = parseInt(files[idx+1].split('-')[0]);
                        // If within 60 seconds, it's opt2
                        if (Math.abs(ts2 - ts1) < 60000) {
                            opt2 = `/uploads/${files[idx+1]}`;
                        }
                    }
                    
                    if (opt2) {
                        updateQueries.push(`UPDATE questions SET opt1_image_url = '${opt1}', opt2_image_url = '${opt2}' WHERE id = ${newQ.id}`);
                    } else {
                        updateQueries.push(`UPDATE questions SET opt1_image_url = '${opt1}' WHERE id = ${newQ.id}`);
                    }
                }
            }
        }
    });
    
    db.serialize(() => {
        updateQueries.forEach(q => db.run(q));
        console.log(`Executed ${updateQueries.length} recovery updates!`);
    });
});
