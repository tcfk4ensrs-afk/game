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

        // ゲーム操作（クリック＆タップ）
        window.addEventListener('mousedown', (e) => this.inputStart(e));
        window.addEventListener('touchstart', (e) => this.inputStart(e), { passive: false });

        // キーボード操作対応
        window.addEventListener('keydown', (e) => {
            if (this.state !== 'PLAYING') return;
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                this.player.jump();
            } else if (e.code === 'ArrowDown') {
                this.player.crouch();
            }
        });

        // ダブルタップ判定用
        this.lastTapTime = 0;
    }

    inputStart(e) {
        if (this.state !== 'PLAYING') return;

        // クリックがUI上の場合は無視（念のため）
        if (e.target.closest('button') || e.target.closest('input')) return;

        const currentTime = new Date().getTime();
        const tapLength = currentTime - this.lastTapTime;

        if (tapLength < 300 && tapLength > 0) {
            // ダブルタップ -> しゃがみ
            this.player.crouch();
            e.preventDefault();
        } else {
            // シングルタップ -> ジャンプ
            this.player.jump();
        }
        this.lastTapTime = currentTime;
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
        this.obstacles.forEach(obs => obs.update(this.speed));
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

        // 難易度に応じた生成間隔
        let interval = 2000;
        if (this.difficulty >= 2) interval = 1500;
        if (this.difficulty >= 3) interval = 1000;
        if (this.difficulty >= 4) interval = 800; // ランダム性も入れたい

        if (this.obstacleTimer > interval) {
            this.addObstacle();
            this.obstacleTimer = 0;
        }
    }

    addObstacle() {
        const type = Math.random() < 0.5 ? 'ground' : 'sky';
        // 難易度低いときはgroundのみなど調整可能

        let obsType = 'rock';
        if (type === 'sky' && this.difficulty >= 2) {
            obsType = 'bird'; // 空飛ぶ敵
        } else if (type === 'ground') {
            obsType = Math.random() < 0.5 ? 'rock' : 'log'; // 岩か丸太
        }

        // 難易度0（まだ'ふ'が出てない等）は少なめに
        if (this.difficulty === 0 && Math.random() < 0.5) return;

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
        if (this.y < this.game.height - this.height - 50) {
            this.vy += this.weight;
            this.y += this.vy;
            this.isJumping = true;
        } else {
            this.y = this.game.height - this.height - 50;
            this.vy = 0;
            this.isJumping = false;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = '#FFD700';
        ctx.shadowBlur = 10;
        ctx.shadowColor = "white";

        // 回転アニメーション
        if (this.isJumping) {
            // パス
        }

        // しゃがみ中は少し潰れる
        let drawHeight = this.height;
        let drawY = this.y;

        this.drawStar(ctx, this.x + this.width / 2, drawY + drawHeight / 2, 5, this.width / 2, this.width / 4);
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

    jump() {
        if (!this.isJumping && !this.isCrouching) {
            this.vy = -18;
            this.isJumping = true;
        }
    }

    crouch() {
        if (!this.isJumping && !this.isCrouching) {
            this.isCrouching = true;
            this.height = this.originalHeight / 2;
            this.y = this.game.height - this.height - 50; // 高さ調整して地面につける

            setTimeout(() => {
                this.height = this.originalHeight;
                this.y = this.game.height - this.height - 50;
                this.isCrouching = false;
            }, 800);
        }
    }

    reset() {
        this.height = this.originalHeight;
        this.y = this.game.height - this.height - 50;
        this.vy = 0;
        this.isJumping = false;
        this.isCrouching = false;
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
        this.width = 50;
        this.height = 50;
        this.markedForDeletion = false;

        if (this.type === 'bird') {
            this.x = this.game.width;
            this.y = this.game.height - 150; // 空中（しゃがんで避ける、あるいはジャンプしないと当たらない高さ）
            this.speedX = this.game.speed + 2; // 鳥は速い
            this.color = 'black';
        } else {
            // ground
            this.x = this.game.width;
            this.y = this.game.height - this.height - 50;
            this.speedX = this.game.speed;
            this.color = '#555';

            if (this.type === 'log') {
                this.width = 30;
                this.height = 60; // 縦長
                this.color = '#8B4513';
            }
        }
    }

    update() {
        this.x -= this.speedX;
        if (this.x < -this.width) this.markedForDeletion = true;

        // プレイヤー衝突判定
        if (this.game.checkCollision(this.game.player.getHitBox(), this)) {
            this.game.gameOver();
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        if (this.type === 'bird') {
            // カラスっぽい形状（三角）
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + this.width, this.y + this.height / 2);
            ctx.lineTo(this.x, this.y + this.height);
            ctx.fill();
        } else if (this.type === 'rock') {
            // 岩（丸）
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // 丸太（四角）
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}

class Background {
    constructor(game) {
        this.game = game;
        this.letters = ['ふ', 'ん', 'す', 'い'];
        this.currentLetter = null;
        this.nextLetterIndex = 0;
        this.letterX = 0;
        this.checkpoints = [1000, 2500, 4000, 5500]; // 文字が出る距離
    }

    update(speed) {
        // 文字出現チェック
        if (this.nextLetterIndex < this.letters.length) {
            if (this.game.distance > this.checkpoints[this.nextLetterIndex]) {
                this.currentLetter = this.letters[this.nextLetterIndex];
                this.letterX = this.game.width; // 右端から出現
                this.nextLetterIndex++;

                // 難易度更新
                this.game.difficulty = this.nextLetterIndex; // 1文字目で難易度1...
                this.game.speed += 1; // スピードアップ
            }
        } else {
            // 全部出た後のループ処理用チェック
            if (this.game.distance > this.checkpoints[this.checkpoints.length - 1] + 2000) {
                // ループリセット
                this.reset();
                this.game.resetParams();
                // ただしスコアや距離は維持したい場合は調整が必要だが、仕様では「難易度リセットしてループ」
            }
        }

        if (this.currentLetter) {
            this.letterX -= speed * 0.2; // 背景としてゆっくり流れる
            if (this.letterX < -200) {
                this.currentLetter = null; // 画面外へ
            }
        }
    }

    draw(ctx) {
        // 背景色（夕方、夜への変化はCSS側でbody背景を変える等も手だが、CanvasでやるならfillRectでalpha重ねるなど）
        // 簡易的に地面
        ctx.fillStyle = '#654321';
        ctx.fillRect(0, this.game.height - 50, this.game.width, 50);

        // 文字描画
        if (this.currentLetter) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.font = 'bold 200px "M PLUS Rounded 1c"';
            ctx.fillText(this.currentLetter, this.letterX, 300);
        }
    }

    reset() {
        this.currentLetter = null;
        this.nextLetterIndex = 0;
        this.letterX = 0;
    }
}

window.addEventListener('load', () => {
    const game = new Game();
});
