/**
 * ふんすいジャンプ！ メインスクリプト
 */

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = 800;
        this.height = 450;

        // Canvas解像度設定
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        // ゲーム状態
        this.state = 'TITLE'; // TITLE, PLAYING, GAMEOVER, CLEAR
        this.speed = 5;
        this.score = 0;
        this.distance = 0;
        this.difficulty = 0; // 0:なし, 1:ふ, 2:ん, 3:す, 4:い

        // ジャンプボタン保持状態
        this.isJumpHeld = false;

        // UI要素
        this.ui = {
            title: document.getElementById('title-screen'),
            input: document.getElementById('input-screen'),
            clear: document.getElementById('clear-screen'),
            startBtn: document.getElementById('start-btn'),
            submitBtn: document.getElementById('submit-btn'),
            retryBtn: document.getElementById('retry-btn'),
            restartBtn: document.getElementById('restart-btn'),
            inputField: document.getElementById('answer-input'),
            message: document.getElementById('input-message')
        };

        // イベントリスナー設定
        this.setupEvents();

        // オブジェクト初期化
        this.player = new Player(this);
        this.obstacles = [];
        this.background = new Background(this);

        // ゲームループ開始
        this.lastTime = 0;
        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    }

    setupEvents() {
        // ボタンイベント
        this.ui.startBtn.addEventListener('click', () => this.start());
        this.ui.submitBtn.addEventListener('click', () => this.checkAnswer());
        this.ui.retryBtn.addEventListener('click', () => this.resetGame());
        this.ui.restartBtn.addEventListener('click', () => this.resetGame());

        // ゲーム操作（マウス＆タッチ）
        const startJumpHandler = (e) => {
            // UI上の操作は除外
            if (e.target.closest('button') || e.target.closest('input')) return;

            if (this.state === 'PLAYING') {
                e.preventDefault(); // タッチ時のスクロール防止など
                this.isJumpHeld = true;
                this.player.startJump();
            }
        };

        const endJumpHandler = (e) => {
            this.isJumpHeld = false;
            if (this.state === 'PLAYING') {
                this.player.endJump();
            }
        };

        window.addEventListener('mousedown', startJumpHandler);
        window.addEventListener('touchstart', startJumpHandler, { passive: false });

        window.addEventListener('mouseup', endJumpHandler);
        window.addEventListener('touchend', endJumpHandler);
        window.addEventListener('touchcancel', endJumpHandler);

        // キーボード操作対応
        window.addEventListener('keydown', (e) => {
            if (this.state !== 'PLAYING') return;
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                if (!e.repeat) {
                    this.isJumpHeld = true;
                    this.player.startJump();
                }
            }
        });

        window.addEventListener('keyup', (e) => {
            if (this.state !== 'PLAYING') return;
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                this.isJumpHeld = false;
                this.player.endJump();
            }
        });
    }



    start() {
        this.state = 'PLAYING';
        this.ui.title.classList.add('hidden');
        this.ui.title.classList.remove('active');
        this.resetParams();
    }

    resetParams() {
        this.speed = 5;
        this.distance = 0;
        this.difficulty = 0;
        this.player.reset();
        this.obstacles = [];
        this.background.reset();
    }

    resetGame() {
        this.ui.input.classList.add('hidden');
        this.ui.input.classList.remove('active');
        this.ui.clear.classList.add('hidden');
        this.ui.clear.classList.remove('active');

        // UIリセット
        this.ui.retryBtn.classList.add('hidden');
        this.ui.message.textContent = "ゲームオーバー";
        this.ui.inputField.value = "";

        this.start();
    }

    gameOver() {
        this.state = 'GAMEOVER';
        this.ui.input.classList.remove('hidden');
        this.ui.input.classList.add('active');
        this.ui.message.textContent = "ぶつかってしまった！";
    }

    checkAnswer() {
        const val = this.ui.inputField.value.trim();
        if (val === 'ふんすい') {
            // クリア処理
            this.gameClear();
        } else {
            // 間違い
            this.ui.message.textContent = "残念！違います...";
            this.ui.retryBtn.classList.remove('hidden');
        }
    }

    gameClear() {
        this.state = 'CLEAR';
        this.ui.input.classList.add('hidden');
        this.ui.input.classList.remove('active');
        this.ui.clear.classList.remove('hidden');
        this.ui.clear.classList.add('active');
    }

    update(deltaTime) {
        if (this.state !== 'PLAYING') return;

        this.distance += this.speed;

        // 難易度調整（仮）
        // 実際はBackgroundの文字出現に合わせて調整

        this.background.update(this.speed);
        this.player.update(deltaTime);

        // 障害物更新
        this.obstacles.forEach(obs => obs.update(deltaTime));
        this.obstacles = this.obstacles.filter(obs => !obs.markedForDeletion);

        // 衝突判定などはここで呼び出す
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        this.background.draw(this.ctx);

        // 文字の描画（背景クラスで管理するが、前面にだすならここでも可。今回は背景クラス内で描画）

        this.player.draw(this.ctx);
        this.obstacles.forEach(obs => obs.draw(this.ctx));
    }

    loop(timestamp) {
        let deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.update(deltaTime);
        this.draw();

        // 障害物生成ロジック
        if (this.state === 'PLAYING') {
            this.handleObstacles(deltaTime);
        }

        requestAnimationFrame(this.loop);
    }

    handleObstacles(deltaTime) {
        // 簡易的な生成タイマー
        if (!this.obstacleTimer) this.obstacleTimer = 0;
        this.obstacleTimer += deltaTime;

        // 難易度に応じた生成間隔（さらに短縮）
        let interval = 1400;
        if (this.difficulty >= 2) interval = 1000;
        if (this.difficulty >= 3) interval = 700;
        if (this.difficulty >= 4) interval = 400; // かなり高頻度

        if (this.obstacleTimer > interval) {
            this.addObstacle();
            this.obstacleTimer = 0;
        }
    }

    addObstacle() {
        const type = Math.random() < 0.5 ? 'ground' : 'sky';

        let obsType = 'rock';
        if (type === 'sky' && this.difficulty >= 1) {
            // 難易度1('ふ'の後)から空飛ぶ敵出現
            obsType = 'bird';
        } else if (type === 'ground') {
            obsType = Math.random() < 0.5 ? 'rock' : 'log';
        }

        // 4文字目は空の敵マシマシ
        if (this.difficulty >= 4 && Math.random() < 0.7) {
            obsType = 'bird';
        }

        // 難易度0でも間引かない（序盤からある程度出す）
        if (this.difficulty === 0 && Math.random() < 0.1) return;

        this.obstacles.push(new Obstacle(this, obsType));
    }

    checkCollision(rect1, rect2) {
        return (
            rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y
        );
    }
}

class Player {
    constructor(game) {
        this.game = game;
        this.width = 50;
        this.height = 50;
        this.x = 100;
        this.y = this.game.height - this.height - 50;
        this.vy = 0;
        this.weight = 1;
        this.isJumping = false;
        this.isCrouching = false;
        this.originalHeight = 50;
    }

    update(deltaTime) {
        // 重力計算（可変ジャンプ）
        // 上昇中（vy < 0）かつボタン長押し中なら重力を弱くする＝高く飛べる
        let currentWeight = this.weight;
        if (this.isJumping && this.vy < 0 && this.game.isJumpHeld) {
            currentWeight = this.weight * 0.3; // 重力を30%に軽減（より滞空できるように）
        }

        // 速度更新
        this.vy += currentWeight;
        this.y += this.vy;

        const groundY = this.game.height - this.height - 50;

        // 接地判定
        if (this.y >= groundY) {
            this.y = groundY;
            this.vy = 0;
            this.isJumping = false;
        } else {
            this.isJumping = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = '#FFD700';
        ctx.shadowBlur = 10;
        ctx.shadowColor = "white";

        this.drawStar(ctx, this.x + this.width / 2, this.y + this.height / 2, 5, this.width / 2, this.width / 4);
        ctx.restore();
    }

    drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        let step = Math.PI / spikes;

        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }
        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
        ctx.fill();
    }

    // 可変ジャンプ：押した瞬間
    startJump() {
        if (!this.isJumping) {
            this.vy = -12; // 初速控えめ
            this.isJumping = true;
        }
    }

    // 可変ジャンプ：離した瞬間
    endJump() {
        // 上昇中なら減速させてジャンプを低く抑える
        if (this.vy < -5) {
            this.vy = -5;
        }
    }

    reset() {
        this.y = this.game.height - this.height - 50;
        this.vy = 0;
        this.isJumping = false;
    }

    getHitBox() {
        // 当たり判定を少し小さくする（遊び）
        return {
            x: this.x + 10,
            y: this.y + 10,
            width: this.width - 20,
            height: this.height - 20
        };
    }
}

class Obstacle {
    constructor(game, type) {
        this.game = game;
        this.type = type; // 'rock', 'log', 'bird'
        this.markedForDeletion = false;

        // サイズのランダム化 (0.8 ~ 1.3倍)
        const scale = 0.8 + Math.random() * 0.5;
        this.width = 50 * scale;
        this.height = 50 * scale;

        // アニメーション用
        this.frameX = 0;
        this.frameTimer = 0;

        if (this.type === 'bird') {
            this.x = this.game.width;

            // 敵の高さバリエーション（3段階）+ 微妙なランダム
            let baseHeight = 130;
            const rand = Math.random();
            if (this.game.difficulty >= 2) {
                if (rand < 0.33) baseHeight = 130;
                else if (rand < 0.66) baseHeight = 190;
                else baseHeight = 260;
            }
            // 少し上下にずらして自然さを出す
            baseHeight += (Math.random() * 40 - 20);

            this.y = this.game.height - baseHeight;
            this.speedX = this.game.speed + 3 + Math.random(); // 速度も少しバラつく
            this.color = '#333';
        } else {
            // ground
            this.x = this.game.width;
            this.y = this.game.height - this.height - 50;
            this.speedX = this.game.speed;

            if (this.type === 'log') {
                this.width = 30 * scale;
                this.height = 60 * scale; // 縦長
                this.color = '#8B4513';
            } else {
                // rock
                this.color = '#696969';
            }
        }
    }

    update(deltaTime) {
        this.x -= this.speedX;
        if (this.x < -this.width) this.markedForDeletion = true;

        // アニメーション更新（簡易）
        this.frameTimer++;
        if (this.frameTimer > 10) {
            this.frameX = this.frameX === 0 ? 1 : 0;
            this.frameTimer = 0;
        }

        // プレイヤー衝突判定
        if (this.game.checkCollision(this.game.player.getHitBox(), this)) {
            this.game.gameOver();
        }
    }

    draw(ctx) {
        if (this.type === 'bird') {
            this.drawBird(ctx);
        } else if (this.type === 'rock') {
            this.drawRock(ctx);
        } else {
            this.drawLog(ctx);
        }
    }

    drawBird(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

        // 胴体
        ctx.beginPath();
        ctx.ellipse(0, 0, this.width / 2, this.height / 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // 頭
        ctx.beginPath();
        ctx.arc(-this.width / 3, -this.height / 4, this.width / 4, 0, Math.PI * 2);
        ctx.fill();

        // 翼（アニメーション）
        ctx.fillStyle = '#111';
        ctx.beginPath();
        const wingY = this.frameX === 0 ? -this.height / 2 : this.height / 4;
        ctx.moveTo(0, 0);
        ctx.lineTo(this.width / 2, wingY);
        ctx.lineTo(-this.width / 4, 0);
        ctx.fill();

        // 目
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(-this.width / 2.5, -this.height / 3.5, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    drawRock(ctx) {
        ctx.save();
        ctx.fillStyle = '#696969';
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

        // ゴツゴツした岩
        ctx.beginPath();
        ctx.moveTo(-this.width / 2, 0);
        ctx.lineTo(-this.width / 3, -this.height / 2);
        ctx.lineTo(0, -this.height / 3);
        ctx.lineTo(this.width / 3, -this.height / 2);
        ctx.lineTo(this.width / 2, 0);
        ctx.lineTo(this.width / 3, this.height / 2);
        ctx.lineTo(-this.width / 3, this.height / 2.5);
        ctx.closePath();
        ctx.fill();

        // ハイライト
        ctx.fillStyle = '#808080';
        ctx.beginPath();
        ctx.arc(-5, -5, this.width / 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    drawLog(ctx) {
        ctx.save();
        ctx.fillStyle = '#8B4513'; // こげ茶
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // 木目
        ctx.strokeStyle = '#5D2906';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x + 5, this.y + 10);
        ctx.lineTo(this.x + 5, this.y + this.height - 10);
        ctx.moveTo(this.x + 15, this.y + 5);
        ctx.lineTo(this.x + 15, this.y + this.height - 5);
        ctx.stroke();

        ctx.restore();
    }
}

class Background {
    constructor(game) {
        this.game = game;
        this.letters = ['ふ', 'ん', 'す', 'い'];
        this.currentLetter = null;
        this.nextLetterIndex = 0;
        this.letterX = 0;
        this.displayTimer = 0;
    }

    update(speed) {
        if (this.currentLetter) {
            const letterIndex = this.nextLetterIndex - 1;

            if (letterIndex === 1) { // 2文字目'ん'
                // 高速移動
                this.letterX -= speed * 2.5;
                if (this.letterX < -300) {
                    this.currentLetter = null;
                    this.spawnTimer = 0;
                }
            } else if (letterIndex === 3) { // 4文字目'い'
                // 超高速移動
                this.letterX -= speed * 4.0;
                if (this.letterX < -300) {
                    this.currentLetter = null;
                    this.spawnTimer = 0;
                }
            } else {
                // 通常 ('ふ', 'す')
                this.letterX -= speed * 0.2;
                if (this.letterX < -300) {
                    this.currentLetter = null;
                    this.spawnTimer = 0;
                }
            }

        } else {
            // 待機状態
            if (this.spawnTimer === undefined) this.spawnTimer = 0;
            this.spawnTimer += 16;

            // 文字間のインターバル
            let waitTime = 2000;
            if (this.nextLetterIndex === 4) waitTime = 3000;

            if (this.spawnTimer > waitTime) {
                if (this.nextLetterIndex < this.letters.length) {
                    this.currentLetter = this.letters[this.nextLetterIndex];
                    this.letterX = this.game.width;
                    this.nextLetterIndex++;
                    this.displayTimer = 0;
                    // 難易度更新
                    this.game.difficulty = this.nextLetterIndex;
                    this.game.speed += 2.0; // 加速強化
                } else {
                    // ループ
                    this.reset();
                    this.game.resetParams();
                }
            }
        }
    }

    draw(ctx) {
        // 背景色
        ctx.fillStyle = '#654321';
        ctx.fillRect(0, this.game.height - 50, this.game.width, 50);

        // 文字描画
        if (this.currentLetter) {
            const letterIndex = this.nextLetterIndex - 1;

            // 色と透明度の設定
            if (letterIndex === 2) { // 'す'
                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'; // 薄く
            } else {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            }

            if (letterIndex === 1 || letterIndex === 2) {
                // 'ん'(1) と 'す'(2) は小さく
                ctx.font = 'bold 100px "M PLUS Rounded 1c"';
            } else {
                // 'ふ'(0) と 'い'(3) は通常サイズ
                ctx.font = 'bold 200px "M PLUS Rounded 1c"';
            }

            ctx.fillText(this.currentLetter, this.letterX, 300);
        }
    }

    reset() {
        this.currentLetter = null;
        this.nextLetterIndex = 0;
        this.letterX = 0;
        this.displayTimer = 0;
    }
}

window.addEventListener('load', () => {
    const game = new Game();
});
