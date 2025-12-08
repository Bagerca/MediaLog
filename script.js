// --- 1. ИМПОРТЫ FIREBASE ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// --- 2. КОНФИГУРАЦИЯ ---
const firebaseConfig = {
    apiKey: "AIzaSyBUt7-YdXbbkJy6KGksI-2xXBRcZeQsqjk",
    authDomain: "medialog-981d1.firebaseapp.com",
    projectId: "medialog-981d1",
    storageBucket: "medialog-981d1.firebasestorage.app",
    messagingSenderId: "928778294488",
    appId: "1:928778294488:web:9a0cdfa99190957dde73ad"
};

// Инициализация
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

console.log("/// SYSTEM: FIREBASE ONLINE");

// --- 3. ОСНОВНОЙ КОД ---
document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // ЛОГИКА АВТОРИЗАЦИИ (LOGIN / REGISTER)
    // ==========================================
    const authModal = document.getElementById('authModal');
    const navAuthBtn = document.getElementById('navAuthBtn');
    const closeAuthBtn = document.getElementById('closeAuth');
    const btnLogin = document.getElementById('btnLogin');
    const btnRegister = document.getElementById('btnRegister');
    const authMsg = document.getElementById('authMsg');

    // Открыть окно / Выйти
    if(navAuthBtn) {
        navAuthBtn.addEventListener('click', () => {
            const currentUser = auth.currentUser;
            if (currentUser) {
                if(confirm("TERMINATE SESSION?")) {
                    signOut(auth).then(() => {
                        alert("/// DISCONNECTED");
                    });
                }
            } else {
                authModal.classList.add('active');
            }
        });
    }

    // Закрыть окно
    if(closeAuthBtn) {
        closeAuthBtn.addEventListener('click', () => {
            authModal.classList.remove('active');
            if(authMsg) authMsg.textContent = "";
        });
    }

    // Вход
    if(btnLogin) {
        btnLogin.addEventListener('click', async () => {
            const email = document.getElementById('emailInput').value;
            const pass = document.getElementById('passInput').value;
            authMsg.textContent = "/// PROCESSING...";

            try {
                await signInWithEmailAndPassword(auth, email, pass);
                authMsg.style.color = "var(--cyan)";
                authMsg.textContent = "ACCESS GRANTED";
                setTimeout(() => authModal.classList.remove('active'), 1000);
            } catch (error) {
                authMsg.style.color = "#ff4d4d";
                authMsg.textContent = "ERROR: " + error.code;
            }
        });
    }

    // Регистрация
    if(btnRegister) {
        btnRegister.addEventListener('click', async () => {
            const email = document.getElementById('emailInput').value;
            const pass = document.getElementById('passInput').value;
            authMsg.textContent = "/// CREATING ID...";

            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
                const user = userCredential.user;

                // Создаем профиль в базе
                await setDoc(doc(db, "users", user.uid), {
                    username: email.split('@')[0],
                    email: email,
                    rank: "ROOKIE",
                    createdAt: serverTimestamp()
                });

                authMsg.style.color = "var(--gold)";
                authMsg.textContent = "ID REGISTERED. WELCOME.";
                setTimeout(() => authModal.classList.remove('active'), 1500);

            } catch (error) {
                authMsg.style.color = "#ff4d4d";
                authMsg.textContent = "ERROR: " + error.code;
            }
        });
    }

    // Слушатель состояния (Меняем кнопку в меню)
    onAuthStateChanged(auth, (user) => {
        if (user) {
            if(navAuthBtn) {
                navAuthBtn.textContent = `[${user.email.split('@')[0]}]`;
                navAuthBtn.style.borderColor = "var(--cyan)";
                navAuthBtn.style.color = "var(--cyan)";
            }
        } else {
            if(navAuthBtn) {
                navAuthBtn.textContent = "LOGIN";
                navAuthBtn.style.borderColor = "var(--gold)";
                navAuthBtn.style.color = "var(--gold)";
            }
        }
    });


    // ==========================================
    // ЛОГИКА КАРТОЧЕК И ИНТЕРФЕЙСА
    // ==========================================
    const pageType = document.body.getAttribute('data-page'); 
    const gridContainer = document.getElementById('cards-container');
    const STORAGE_KEY_COLS = 'resonance_grid_columns';
    
    if (pageType && gridContainer) {
        fetch('data.json')
            .then(response => response.json())
            .then(data => {
                const items = data[pageType];
                renderCards(items, pageType);
                generateFilters(items); 
                initInterface(); 
            })
            .catch(error => console.error('Ошибка загрузки базы данных:', error));
    } else {
        initInterface();
    }

    // 1. ГЕНЕРАЦИЯ HTML
    function renderCards(items, type) {
        if (!items) return;
        
        gridContainer.innerHTML = items.map((item) => {
            // --- ЛОГИКА ДЛЯ ИГР (Широкие модули) ---
            if (type === 'games') {
                const isOnline = item.meta_sub && (item.meta_sub.includes('ACTIVE') || item.meta_sub.includes('DAILY'));
                const rankClass = item.rank.toLowerCase();
                
                // ВАЖНО: Тут НЕТ класса .card, чтобы не ломались стили games.css
                return `
                <div class="game-module" 
                     data-tags="${item.tags}" 
                     data-platform="${item.platform}"
                     data-dev="${item.dev}"
                     data-desc="${item.desc}"
                     data-rank="${item.rank}">
                    
                    <div class="module-bg" style="background-image: url('${item.image}');"></div>
                    
                    <!-- Декор углы -->
                    <div class="corner t-l"></div><div class="corner t-r"></div>
                    <div class="corner b-l"></div><div class="corner b-r"></div>

                    <div class="module-content">
                        <div class="module-top">
                            <span class="platform">${item.platform}</span>
                            <span class="rank ${rankClass}">${item.rank}</span>
                        </div>

                        <div class="module-main">
                            <h2 class="card-title">${item.title}</h2>
                            <div class="playtime">${item.meta_highlight}</div>
                        </div>

                        <div class="module-footer">
                            <div class="status">${item.meta_sub}</div>
                            ${isOnline ? 
                                `<div class="progress-bar"><div class="progress infinite"></div></div>` : 
                                `<div class="progress-bar"><div class="progress" style="width: 100%"></div></div>`
                            }
                        </div>
                    </div>
                     <!-- Скрытое изображение для модалки -->
                    <div class="card-img-hidden" style="display:none; background-image: url('${item.image}');"></div>
                </div>
                `;
            } 
            
            // --- ЛОГИКА ДЛЯ АНИМЕ (Высокие карточки) ---
            else {
                return `
                <div class="anime-card card"
                     data-tags="${item.tags}" 
                     data-platform="${item.platform}"
                     data-dev="${item.dev}"
                     data-desc="${item.desc}"
                     data-rank="${item.rank}">
                    
                    <div class="poster-wrapper">
                        <div class="rating-badge ${item.rank.toLowerCase()}">${item.rank}</div>
                        <img src="${item.image}" alt="${item.title}" class="card-img" style="background-image: url('${item.image}')"> 
                        
                        <div class="poster-overlay">
                            <button class="view-btn">ACCESS DATA</button>
                        </div>
                    </div>

                    <div class="anime-info">
                        <h3 class="card-title">${item.title}</h3>
                        <div class="meta-row">
                            <span>${item.dev}</span>
                            <span class="type-tag">${item.platform}</span>
                        </div>
                        <div class="status-bar ${item.meta_sub === 'COMPLETED' ? 'completed' : ''}">
                            <span>${item.meta_highlight}</span>
                            <div class="bar-fill"></div>
                            <span>${item.meta_sub}</span>
                        </div>
                    </div>
                </div>
                `;
            }
        }).join('');
    }

    // 2. ФИЛЬТРЫ
    function generateFilters(items) {
        const filterContainer = document.getElementById('filterOptions');
        if (!filterContainer) return;

        const allTags = new Set();
        items.forEach(item => {
            if (item.tags) item.tags.split(',').forEach(tag => allTags.add(tag.trim()));
        });

        const sortedTags = Array.from(allTags).sort();
        let html = `<div class="option active" data-filter="all">ALL RECORDS</div>`;
        sortedTags.forEach(tag => {
            html += `<div class="option" data-filter="${tag}">${tag}</div>`;
        });

        filterContainer.innerHTML = html;
    }

    // 3. ИНИЦИАЛИЗАЦИЯ ИНТЕРФЕЙСА
    function initInterface() {
        // Анимация появления (добавлен .game-module)
        const cards = document.querySelectorAll('.card, .game-module, .hub-card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100 + 50);
        });

        // Эффект текста заголовка
        const headerTitle = document.querySelector('.page-header h1');
        if (headerTitle) {
            const originalText = headerTitle.innerText;
            const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890@#$%^&*";
            let iteration = 0;
            let interval = setInterval(() => {
                headerTitle.innerText = originalText.split("").map((letter, index) => {
                    if (index < iteration) return originalText[index];
                    return chars[Math.floor(Math.random() * chars.length)];
                }).join("");
                if (iteration >= originalText.length) clearInterval(interval);
                iteration += 1 / 2;
            }, 30);
        }

        // Логика Сетки
        const viewBtns = document.querySelectorAll('.view-btn');
        const grid = document.querySelector('.grid-cards');

        function applyGridColumns(cols) {
            if (!grid) return;
            grid.className = 'grid-cards';
            grid.classList.add(`cols-${cols}`);
            
            // Спец классы для CSS
            if(pageType === 'games') grid.classList.add('games-grid'); 
            if(pageType === 'anime') grid.classList.add('anime-grid'); 

            viewBtns.forEach(b => {
                b.classList.remove('active');
                if (b.getAttribute('data-cols') === cols) b.classList.add('active');
            });
        }

        if (grid) {
            const savedCols = localStorage.getItem(STORAGE_KEY_COLS);
            if (savedCols) applyGridColumns(savedCols);
            else applyGridColumns('4'); // ПО УМОЛЧАНИЮ 4
        }

        viewBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const cols = btn.getAttribute('data-cols');
                applyGridColumns(cols);
                localStorage.setItem(STORAGE_KEY_COLS, cols);
            });
        });

        // Поиск и Фильтрация
        const dropdown = document.querySelector('.custom-dropdown');
        const searchInput = document.getElementById('searchInput');
        let currentFilterTag = 'all';
        let currentSearch = '';

        function updateList() {
            // Ищем и карточки аниме, и модули игр
            const allItems = document.querySelectorAll('.card, .game-module');
            
            allItems.forEach(item => {
                const itemTags = item.getAttribute('data-tags') || "";
                const titleEl = item.querySelector('.card-title');
                const itemTitle = titleEl ? titleEl.textContent.toLowerCase() : "";
                
                const matchTag = (currentFilterTag === 'all' || itemTags.includes(currentFilterTag));
                const matchSearch = itemTitle.includes(currentSearch);

                if (matchTag && matchSearch) {
                    item.style.display = 'block'; 
                    setTimeout(() => { item.style.opacity = '1'; item.style.transform = 'translateY(0)'; }, 50);
                } else {
                    item.style.display = 'none';
                    item.style.opacity = '0';
                }
            });
        }

        if (dropdown) {
            const trigger = dropdown.querySelector('.dropdown-trigger');
            const optionsContainer = dropdown.querySelector('.dropdown-options');
            const selectedText = dropdown.querySelector('.selected-text');

            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.toggle('open');
            });

            if (optionsContainer) {
                optionsContainer.addEventListener('click', (e) => {
                    const option = e.target.closest('.option');
                    if (!option) return;
                    optionsContainer.querySelectorAll('.option').forEach(opt => opt.classList.remove('active'));
                    option.classList.add('active');
                    const filterValue = option.getAttribute('data-filter');
                    selectedText.textContent = (filterValue === 'all') ? 'FILTER BY TAGS' : option.textContent;
                    dropdown.classList.remove('open');
                    currentFilterTag = filterValue;
                    updateList();
                });
            }
            document.addEventListener('click', (e) => {
                if (!dropdown.contains(e.target)) dropdown.classList.remove('open');
            });
        }

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                currentSearch = e.target.value.toLowerCase().trim();
                updateList();
            });
        }

        initModal(); 
    }

    // 4. ДЕТАЛЬНОЕ ОКНО (HUD)
    function initModal() {
        const modal = document.getElementById('detailModal');
        const closeBtn = document.getElementById('closeModal');
        const grid = document.querySelector('.grid-cards');

        if (!modal) return;

        const modalImg = document.getElementById('modalImg');
        const modalTitle = document.getElementById('modalTitle');
        const modalDesc = document.getElementById('modalDesc');
        const modalRankTag = document.getElementById('modalRank');
        const modalTags = document.getElementById('modalTags');
        const modalPlatform = document.getElementById('modalPlatform');
        const modalDev = document.getElementById('modalDev');

        function openModal(card) {
            let bgUrl = "";
            
            // Ищем картинку (для игр скрытую, для аниме обычную)
            const hiddenImg = card.querySelector('.card-img-hidden');
            const animeImg = card.querySelector('img.card-img');
            const moduleBg = card.querySelector('.module-bg'); // fallback

            if (hiddenImg) {
                 const style = hiddenImg.style.backgroundImage;
                 bgUrl = style.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
            } else if (animeImg) {
                bgUrl = animeImg.src;
            } else if (moduleBg) {
                 const style = moduleBg.style.backgroundImage;
                 bgUrl = style.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
            }

            const title = card.querySelector('.card-title').textContent;
            const desc = card.getAttribute('data-desc') || "No description.";
            const rawTags = card.getAttribute('data-tags') || "ARCHIVE";
            const platform = card.getAttribute('data-platform') || "Unknown";
            const developer = card.getAttribute('data-dev') || "Unknown";
            const rank = card.getAttribute('data-rank') || "N/A";

            if(modalImg) modalImg.src = bgUrl; 
            if(modalTitle) modalTitle.textContent = title;
            if(modalDesc) modalDesc.textContent = desc;
            
            if(modalPlatform) modalPlatform.textContent = platform;
            if(modalDev) modalDev.textContent = developer;

            if(modalRankTag) {
                modalRankTag.textContent = rank;
                if (rank === 'UR') modalRankTag.style.color = 'var(--gold)';
                else if (rank === 'SSR') modalRankTag.style.color = 'var(--cyan)';
                else modalRankTag.style.color = 'rgba(255,255,255,0.05)';
            }

            if(modalTags) {
                modalTags.innerHTML = '';
                const tagsArray = rawTags.split(',');
                tagsArray.forEach(tag => {
                    const span = document.createElement('span');
                    span.className = 'tech-tag';
                    span.textContent = tag.trim();
                    modalTags.appendChild(span);
                });
            }

            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closeModal() {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }

        if(grid) {
            grid.addEventListener('click', (e) => {
                // Клик по карточке (или игре, или аниме)
                const card = e.target.closest('.card') || e.target.closest('.game-module');
                if (card) openModal(card);
            });
        }

        if(closeBtn) closeBtn.onclick = closeModal;
        modal.onclick = (e) => { if (e.target === modal) closeModal(); };
        document.onkeydown = (e) => { if (e.key === 'Escape' && modal.classList.contains('active')) closeModal(); };
    }
});
