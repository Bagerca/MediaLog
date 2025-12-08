document.addEventListener('DOMContentLoaded', () => {
    
    // --- КОНФИГУРАЦИЯ ---
    const pageType = document.body.getAttribute('data-page'); // 'games' или 'anime'
    const gridContainer = document.getElementById('cards-container');
    const STORAGE_KEY_LIB = `resonance_library_${pageType}`; // Уникальный ключ для каждого раздела
    const STORAGE_KEY_COLS = 'resonance_grid_columns';
    
    // --- СОСТОЯНИЕ ---
    let allItemsData = []; // Все загруженные данные
    let myLibrary = new Set(JSON.parse(localStorage.getItem(STORAGE_KEY_LIB)) || []);
    let activeTags = new Set();
    let currentMode = 'all'; // 'all' или 'mine'

    // --- 1. ЗАГРУЗКА ---
    if (pageType && gridContainer) {
        fetch('data.json')
            .then(res => res.json())
            .then(data => {
                allItemsData = data[pageType]; // Сохраняем в глобальную переменную
                generateTagMatrix(allItemsData);
                initInterface();
                renderContent(); // Первичный рендер
            })
            .catch(err => console.error('System Failure:', err));
    } else {
        initInterface();
    }

    // --- 2. РЕНДЕР КОНТЕНТА (УМНЫЙ) ---
    function renderContent() {
        if (!gridContainer) return;

        // 1. Фильтр по режиму (Все или Мои)
        let itemsToRender = allItemsData;
        if (currentMode === 'mine') {
            itemsToRender = allItemsData.filter(item => myLibrary.has(item.title));
        }

        // 2. Фильтр по поиску
        const searchVal = document.getElementById('searchInput')?.value.toLowerCase().trim() || '';
        if (searchVal) {
            itemsToRender = itemsToRender.filter(item => item.title.toLowerCase().includes(searchVal));
        }

        // 3. Фильтр по тегам
        if (activeTags.size > 0) {
            const activeArray = Array.from(activeTags).map(t => t.toLowerCase());
            itemsToRender = itemsToRender.filter(item => {
                const itemTags = (item.tags || '').toLowerCase();
                return activeArray.some(tag => itemTags.includes(tag));
            });
        }

        // 4. Отрисовка или Пустое состояние
        if (itemsToRender.length === 0) {
            gridContainer.innerHTML = `<div class="empty-state">/// NO RECORDS FOUND IN SECTOR</div>`;
            return;
        }

        // Генерация HTML
        const prefix = (pageType === 'games') ? 'game' : 'anime';
        
        gridContainer.innerHTML = itemsToRender.map(item => {
            const isOwned = myLibrary.has(item.title);
            const btnClass = isOwned ? 'in-lib' : '';
            const btnIcon = isOwned ? '✓' : '+';
            
            // Цвет ранга
            const metaColor = (item.rank === 'UR') ? 'var(--gold)' : (item.rank === 'SSR') ? 'var(--cyan)' : 'var(--text-muted)';

            return `
            <div class="${prefix}-card" 
                 onclick="openModal('${item.title.replace(/'/g, "\\'")}')"> 
                
                <!-- Кнопка быстрого добавления (останавливаем всплытие клика) -->
                <div class="card-add-btn ${btnClass}" onclick="toggleItem(event, '${item.title.replace(/'/g, "\\'")}')">
                    ${btnIcon}
                </div>

                <div class="${prefix}-card-inner">
                    <div class="${prefix}-card-img" style="background-image: url('${item.image}');"></div>
                    <div class="${prefix}-rank-badge ${item.rank.toLowerCase()}">${item.rank}</div>
                    
                    <div class="${prefix}-card-content">
                        <div class="${prefix}-card-title">${item.title}</div>
                        <div class="${prefix}-card-meta">
                            <span style="color: ${metaColor}; font-weight: bold;">${item.meta_highlight}</span>
                            <span>${item.meta_sub}</span>
                        </div>
                    </div>
                </div>
            </div>
            `;
        }).join('');
    }

    // --- 3. ЛОГИКА БИБЛИОТЕКИ ---
    
    // Глобальная функция для вызова из HTML (onclick)
    window.toggleItem = function(e, title) {
        if(e) e.stopPropagation(); // Чтобы не открывалась модалка

        if (myLibrary.has(title)) {
            myLibrary.delete(title);
            showToast(`REMOVED: ${title}`);
        } else {
            myLibrary.add(title);
            showToast(`ADDED: ${title}`);
        }
        
        // Сохраняем и перерисовываем
        localStorage.setItem(STORAGE_KEY_LIB, JSON.stringify(Array.from(myLibrary)));
        
        // Если мы в модальном окне, обновляем кнопку там
        updateModalButton(title);
        
        renderContent();
    };

    function updateModalButton(title) {
        const btn = document.getElementById('modalActionBtn');
        if (!btn) return;
        
        if (myLibrary.has(title)) {
            btn.textContent = "REMOVE FROM LIBRARY";
            btn.style.background = "#333";
            btn.style.color = "#fff";
        } else {
            btn.textContent = "ADD TO COLLECTION";
            btn.style.background = (pageType === 'games') ? 'var(--gold)' : 'var(--cyan)';
            btn.style.color = "#000";
        }
    }

    function showToast(msg) {
        const toast = document.getElementById('sysToast');
        if(!toast) return;
        toast.querySelector('.toast-msg').textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2000);
    }

    // --- 4. МОДАЛЬНОЕ ОКНО ---
    window.openModal = function(title) {
        const item = allItemsData.find(i => i.title === title);
        if (!item) return;

        const modal = document.getElementById('detailModal');
        
        document.getElementById('modalImg').src = item.image;
        document.getElementById('modalTitle').textContent = item.title;
        document.getElementById('modalDesc').textContent = item.desc;
        document.getElementById('modalPlatform').textContent = item.platform;
        document.getElementById('modalDev').textContent = item.dev;
        
        // Ранг
        const rInfo = document.getElementById('modalRank');
        rInfo.textContent = item.rank;
        rInfo.style.color = (item.rank === 'UR') ? 'var(--gold)' : (item.rank === 'SSR' ? 'var(--cyan)' : '#333');

        // Теги
        const tagsBox = document.getElementById('modalTags');
        tagsBox.innerHTML = '';
        if (item.tags) {
            item.tags.split(',').forEach(t => {
                const s = document.createElement('span');
                s.className = 'tech-tag'; s.textContent = t.trim();
                tagsBox.appendChild(s);
            });
        }

        // Настраиваем главную кнопку
        const actionBtn = document.querySelector('.action-btn');
        actionBtn.id = 'modalActionBtn'; // Даем ID для поиска
        actionBtn.onclick = () => toggleItem(null, item.title);
        updateModalButton(item.title);

        modal.classList.add('active');
    };

    // --- 5. ИНТЕРФЕЙС И СОБЫТИЯ ---
    function initInterface() {
        
        // А. Переключатель режимов (Global / My)
        const modeBtns = document.querySelectorAll('.mode-btn');
        modeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                modeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentMode = btn.dataset.mode;
                renderContent();
            });
        });

        // Б. Поиск
        const searchInput = document.getElementById('searchInput');
        if(searchInput) searchInput.addEventListener('input', renderContent);

        // В. Сетка
        const grid = document.querySelector('.grid-cards');
        const savedCols = localStorage.getItem(STORAGE_KEY_COLS);
        if (savedCols && grid) {
            grid.className = `grid-cards cols-${savedCols}`;
            document.querySelector(`.view-btn[data-cols="${savedCols}"]`)?.classList.add('active');
        }
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const cols = btn.dataset.cols;
                if(grid) grid.className = `grid-cards cols-${cols}`;
                localStorage.setItem(STORAGE_KEY_COLS, cols);
            });
        });

        // Г. Модалка закрытие
        const modal = document.getElementById('detailModal');
        document.getElementById('closeModal').onclick = () => modal.classList.remove('active');
        modal.onclick = (e) => { if(e.target === modal) modal.classList.remove('active'); };
        document.onkeydown = (e) => { if (e.key === 'Escape') modal.classList.remove('active'); };

        // Д. Анимация заголовка
        const h1 = document.querySelector('.page-header h1');
        if(h1) {
            const txt = h1.innerText;
            const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            let iter = 0;
            let timer = setInterval(() => {
                h1.innerText = txt.split("").map((l, i) => {
                    if (i < iter) return txt[i];
                    return chars[Math.floor(Math.random() * chars.length)];
                }).join("");
                if(iter >= txt.length) clearInterval(timer);
                iter += 1/2;
            }, 30);
        }
    }

    // --- 6. ГЕНЕРАЦИЯ ТЕГОВ ---
    function generateTagMatrix(items) {
        const container = document.getElementById('filterOptions');
        const clearBtn = document.getElementById('clearTagsBtn');
        if (!container) return;

        const allTags = new Set();
        items.forEach(i => i.tags && i.tags.split(',').forEach(t => allTags.add(t.trim())));
        
        container.innerHTML = Array.from(allTags).sort().map(tag => 
            `<button class="tag-btn" data-tag="${tag}">${tag}</button>`
        ).join('');

        container.querySelectorAll('.tag-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tag = btn.dataset.tag;
                if (activeTags.has(tag)) {
                    activeTags.delete(tag);
                    btn.classList.remove('active');
                } else {
                    activeTags.add(tag);
                    btn.classList.add('active');
                }
                clearBtn.style.display = activeTags.size ? 'block' : 'none';
                renderContent();
            });
        });

        clearBtn.addEventListener('click', () => {
            activeTags.clear();
            container.querySelectorAll('.tag-btn').forEach(b => b.classList.remove('active'));
            clearBtn.style.display = 'none';
            renderContent();
        });
    }
});
