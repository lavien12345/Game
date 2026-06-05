document.addEventListener('DOMContentLoaded', () => {
    // === 取得所有頁面 ===
    const screens = {
        start: document.getElementById('start-screen'),
        difficulty: document.getElementById('difficulty-screen'),
        loading: document.getElementById('loading-screen'),
        easy: document.getElementById('easy-mission-screen'),
        medium: document.getElementById('medium-mission-screen'),
        hard: document.getElementById('hard-mission-screen'),
        game: document.getElementById('game-play-screen'),
        record: document.getElementById('record-screen')
    };

    // === 取得元件 ===
    const startBtn = document.getElementById('start-btn');
    const okBtn = document.getElementById('ok-btn');
    const gameOkBtn = document.getElementById('game-ok-btn');
    const recordOkBtn = document.getElementById('record-ok-btn');
    const diffCards = document.querySelectorAll('.diff-card');
    const toGameBtns = document.querySelectorAll('.to-game-btn');
    const timerDisplay = document.getElementById('game-timer');
    const errorOverlay = document.getElementById('error-overlay');

    let selectedDifficulty = 'easy';
    let timerInterval;
    let secondsElapsed = 0;

    // === 筆刷狀態 ===
    let activeBrushColor = null;
    let activeBrushPattern = null;

    // === 各難度預設解答 ===
    const SOLUTIONS = {
        // 每關 3 個甜甜圈，每個指定 [color, pattern] (null = 不套用)
        easy: [
            { color: '#33FF33', pattern: 'assets/Ellipse 17.png' },
            { color: '#FF66B2', pattern: 'assets/Ellipse 19.png' },
            { color: '#3399FF', pattern: 'assets/Ellipse 21.png' }
        ],
        medium: [
            { color: '#3399FF', pattern: 'assets/Exclude.png' },
            { color: null,      pattern: 'assets/Ellipse 23.png' },
            { color: '#FF66B2', pattern: null }
        ],
        hard: [
            { color: '#3399FF', pattern: null },
            { color: null,      pattern: 'assets/Exclude.png' },
            { color: null,      pattern: null }
        ]
    };

    // === 追蹤每個遊戲甜甜圈的實際狀態 ===
    const gameToruses = document.querySelectorAll('.game-torus-item');
    const torusState = Array.from(gameToruses).map(() => ({
        color: null,
        pattern: null
    }));

    // === 1. 導覽邏輯 ===
    startBtn.addEventListener('click', () => {
        screens.start.classList.remove('active');
        screens.difficulty.classList.add('active');
    });

    diffCards.forEach(card => {
        card.addEventListener('click', () => {
            diffCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedDifficulty = card.getAttribute('data-level');
        });
    });

    okBtn.addEventListener('click', () => {
        screens.difficulty.classList.remove('active');
        screens.loading.classList.add('active');
        setTimeout(() => {
            screens.loading.classList.remove('active');
            screens[selectedDifficulty].classList.add('active');
        }, 3000);
    });

    toGameBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // 重置所有遊戲甜甜圈狀態
            torusState.forEach(t => { t.color = null; t.pattern = null; });
            gameToruses.forEach(torus => {
                const cl = torus.querySelector('.color-layer');
                const pl = torus.querySelector('.pattern-layer');
                if (cl) cl.style.backgroundColor = 'transparent';
                if (pl) { pl.src = ''; pl.style.display = 'none'; }
            });

            Object.values(screens).forEach(s => s.classList.remove('active'));
            screens.game.classList.add('active');
            startGameTimer();
        });
    });

    // === 2. 計時器 ===
    function startGameTimer() {
        clearInterval(timerInterval);
        secondsElapsed = 0;
        timerInterval = setInterval(() => {
            secondsElapsed++;
            const minutes = String(Math.floor(secondsElapsed / 60)).padStart(2, '0');
            const seconds = String(secondsElapsed % 60).padStart(2, '0');
            timerDisplay.innerText = `${minutes}:${seconds}`;
        }, 1000);
    }

    // === 3. 畫筆邏輯 ===
    const brushes = document.querySelectorAll('.color-orb, .pattern-orb');

    function applyBrush(torus, index) {
        const colorLayer = torus.querySelector('.color-layer');
        const patternLayer = torus.querySelector('.pattern-layer');

        if (activeBrushColor && colorLayer) {
            colorLayer.style.backgroundColor = activeBrushColor;
            torusState[index].color = activeBrushColor;
        }

        if (activeBrushPattern && patternLayer) {
            patternLayer.src = activeBrushPattern;
            patternLayer.style.display = 'block';
            torusState[index].pattern = activeBrushPattern;
        }

        console.log(`Torus ${index + 1}:`, JSON.stringify(torusState[index]));
    }

    brushes.forEach(orb => {
        // 點擊選取
        orb.addEventListener('click', () => {
            brushes.forEach(b => b.classList.remove('active-brush'));
            orb.classList.add('active-brush');
            activeBrushColor = orb.dataset.color || null;
            activeBrushPattern = orb.dataset.pattern || null;
            console.log('Brush:', activeBrushColor || activeBrushPattern);
        });
    });

    gameToruses.forEach((torus, i) => {
        torus.addEventListener('click', () => applyBrush(torus, i));
    });

    // === 4. 驗證 + 遊戲結束 ===
    gameOkBtn.addEventListener('click', () => {
        const solution = SOLUTIONS[selectedDifficulty];

        // 檢查每個甜甜圈是否與解答完全一致
        let allMatch = true;
        for (let i = 0; i < solution.length; i++) {
            const s = solution[i];
            const t = torusState[i];
            if (s.color !== t.color || s.pattern !== t.pattern) {
                allMatch = false;
                console.log(`Mismatch at torus ${i + 1}: expected ${JSON.stringify(s)}, got ${JSON.stringify(t)}`);
                break;
            }
        }

        if (!allMatch) {
            // 顯示錯誤提示
            errorOverlay.classList.add('active');
            // 2 秒後自動隱藏
            setTimeout(() => {
                errorOverlay.classList.remove('active');
            }, 2000);
            return;
        }

        // === 過關：停止計時、計算分數 ===
        clearInterval(timerInterval);

        const timeStr = timerDisplay.innerText;
        const [min, sec] = timeStr.split(':').map(Number);
        const totalSec = min * 60 + sec;

        const diffMultiplier = { easy: 1, medium: 1.5, hard: 2 }[selectedDifficulty] || 1;
        const raw = Math.max(0, 60 - totalSec) / 60 * 1000;
        const score = Math.round(raw * diffMultiplier);

        let rank = 'C';
        if (score >= 900) rank = 'S';
        else if (score >= 700) rank = 'A';
        else if (score >= 400) rank = 'B';

        document.getElementById('record-time').innerText = timeStr;
        document.getElementById('record-score').innerText = score;
        document.getElementById('record-rank').innerText = rank;

        screens.game.classList.remove('active');
        screens.record.classList.add('active');
    });

    // 點擊錯誤浮層也可關閉
    errorOverlay.addEventListener('click', () => {
        errorOverlay.classList.remove('active');
    });

    // === 5. 重新開始 ===
    recordOkBtn.addEventListener('click', () => {
        window.location.reload();
    });
});