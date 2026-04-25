const fs = require('fs');
const path = require('path');
const { Jimp } = require('jimp');

const dir = path.join(__dirname, 'public', 'images');

const resizeConfig = {
    'avatar_fail.png': 200,
    'avatar_success.png': 200,
    'expert_appraiser.png': 150,
    'banner.png': 500,
    'banner_new.png': 500,
    'treasure_banner.png': 500,
    'bg.png': 500,
    'expert_bg_25d.png': 500,
    'jade_ebook.png': 300,
    'placeholder.png': 300
};

async function compress() {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (resizeConfig[file]) {
            const filePath = path.join(dir, file);
            const stats = fs.statSync(filePath);
            console.log(`Compressing ${file}... Current size: ${(stats.size/1024).toFixed(2)} KB`);
            try {
                const image = await Jimp.read(filePath);
                const targetWidth = resizeConfig[file];
                
                if (image.bitmap.width > targetWidth) {
                    image.resize({ w: targetWidth });
                    await image.write(filePath);
                    const newStats = fs.statSync(filePath);
                    console.log(` -> Resized to ${targetWidth}px. New size: ${(newStats.size/1024).toFixed(2)} KB`);
                } else {
                    console.log(` -> Already smaller than ${targetWidth}px`);
                }
            } catch (e) {
                console.error("Error with file: " + file, e.message);
            }
        }
    }
}
compress();
