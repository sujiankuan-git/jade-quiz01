const fs = require('fs');
const sounds = JSON.parse(fs.readFileSync('sounds.json'));

let html = fs.readFileSync('public/index.html', 'utf8');

const soundManagerNew = `// SoundManager using HTML5 Audio with Base64 WAVs for WeChat Compatibility
        const SoundManager = {
            enabled: true,
            unlocked: false,
            sounds: {
                click: new Audio('${sounds.click}'),
                tick: new Audio('${sounds.tick}'),
                tension: new Audio('${sounds.tension}'),
                correct: new Audio('${sounds.correct}'),
                wrong: new Audio('${sounds.wrong}'),
                win: new Audio('${sounds.win}'),
                lose: new Audio('${sounds.lose}')
            },
            init() {
                if (this.unlocked) return;
                // Pre-play all to unlock in WeChat
                for (let k in this.sounds) {
                    this.sounds[k].load();
                    this.sounds[k].volume = 0;
                    this.sounds[k].play().catch(e => {});
                    this.sounds[k].pause();
                    this.sounds[k].currentTime = 0;
                    this.sounds[k].volume = 1;
                }
                this.unlocked = true;
            },
            unlock() {
                this.init();
            },
            play(name) {
                if (!this.enabled) return;
                const s = this.sounds[name];
                if (s) {
                    s.currentTime = 0;
                    s.volume = 1;
                    s.play().catch(e => console.log('Audio play failed:', e));
                }
            },
            playClick() { this.play('click'); },
            playTick() { this.play('tick'); },
            playTension() { this.play('tension'); },
            playCorrect() { this.play('correct'); },
            playWrong() { this.play('wrong'); },
            playWin() { this.play('win'); },
            playLose() { this.play('lose'); }
        };`;

const startIdx = html.indexOf('// SoundManager using Web Audio API');
const endIdx = html.indexOf('// Unlock audio on first interaction');
if(startIdx !== -1 && endIdx !== -1) {
    const end = html.lastIndexOf('};', endIdx) + 2;
    html = html.substring(0, startIdx) + soundManagerNew + '\n\n        ' + html.substring(endIdx);
    fs.writeFileSync('public/index.html', html);
    console.log('Replaced successfully');
} else {
    console.log('Could not find boundaries', startIdx, endIdx);
}
