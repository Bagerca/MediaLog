document.addEventListener('DOMContentLoaded', () => {
    
    // --- КОНФИГУРАЦИЯ ---
    const pageType = document.body.getAttribute('data-page'); 
    const gridContainer = document.getElementById('cards-container');
    const STORAGE_KEY = `resonance_data_${pageType}`; // Уникальная база для игр и аниме
    
    // --- СОСТОЯНИЕ ---
    let allItemsDB = []; // Данные из JSON (база)
    let userLibrary = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; // Твои данные { "Title": {rank, note} }
    let currentMode = 'all'; // 'all' или 'mine'
    let activeTags = new Set();

    // --- 1. ИНИЦИАЛИЗАЦИЯ ---
    if (pageType && gridContainer) {
        fetch('data.json')
            .then(res => res.json())
            .then(data => {
                allItemsDB = data[pageType];
                generateTagMatrix(allItemsDB);
                initInterface();
                renderContent();
            });
    } else {
        initInterface();
    }

    // --- 2. РЕНДЕР КАРТОЧЕК ---
    function renderContent() {
        if (!gridContainer) return;

        let items = allItemsDB;

        // Фильтр: Мои / Все
        if (currentMode === 'mine') {
            items = items.filter(i => userLibrary[i.title]);
        }

        // Фильтр: Поиск
        const searchVal = document.getElementById('searchInput')?.value.toLowerCase().trim();
        if (searchVal) items = items.filter(i => i.title.toLowerCase().includes(searchVal));

        // Фильтр: Теги
        if (activeTags.size > 0) {
            const tagsArr = Array.from(activeTags);
            items = items.filter(i => {
                const iTags = (i.tags || '').toLowerCase();
                return tagsArr.some(t => iTags.includes(t.toLowerCase()));
            });
        }

        if (items.length === 0) {
            gridContainer.innerHTML = `<div class="empty-state">NO DATA FOUND</div>`;
            return;
        }

        const prefix = (pageType === 'games') ? 'game' : 'anime';

        gridContainer.innerHTML = items.map(item => {
            // Проверяем, есть ли пользовательские данные
            const userData = userLibrary[item.title];
            const userRank = userData ? userData.rank : null;
            
            // Если есть данные, показываем ранг пользователя, иначе пусто
            const rankHtml = userRank ? `<div class="${prefix}-rank-badge ${userRank.toLowerCase()}">${userRank}</div>` : '';
            const addedClass = userData ? 'in-lib' : '';
            
            // Мета данные: если есть заметка, пишем "EDITED", иначе дефолт
            const metaText = userData ? "IN LIBRARY" : "DATABASE";
            const metaColor = userData ? (pageType === 'games' ? 'var(--gold)' : 'var(--cyan)') : 'var(--text-muted)';

            return `
            <div class="${prefix}-card" onclick="openEditor('${item.title.replace(/'/g, "\\'")}')">
                <div class="${prefix}-card-inner">
                    <div class="${prefix}-card-img" style="background-image: url('${item.image}');"></div>
                    ${rankHtml}
                    <div class="${prefix}-card-content">
                        <div class="${prefix}-card-title">${item.title}</div>
                        <div class="${prefix}-card-meta">
                            <span style="color: ${metaColor}; font-weight: bold;">${metaText}</span>
                        </div>
                    </div>
                </div>
                <!-- Индикатор наличия в библиотеке -->
                <div class="card-add-btn ${addedClass}">✓</div>
            </div>`;
        }).join('');
    }

    // --- 3. РЕДАКТОР (МОДАЛЬНОЕ ОКНО) ---
    window.openEditor = function(title) {
        const item = allItemsDB.find(i => i.title === title);
        const userData = userLibrary[title] || { rank: 'N', note: '' }; // Дефолт
        
        const modal = document.getElementById('detailModal');
        
        // Заполняем статику
        document.getElementById('modalImg').src = item.image;
        document.getElementById('modalTitle').textContent = item.title;
        document.getElementById('modalDev').textContent = item.dev;
        document.getElementById('modalPlatform').textContent = item.platform;
        
        // Заполняем теги
        const tagsBox = document.getElementById('modalTags');
        tagsBox.innerHTML = item.tags.split(',').map(t => `<span class="tech-tag">${t.trim()}</span>`).join('');

        // --- ФОРМА ---
        // 1. Заполняем заметку
        const noteInput = document.getElementById('userNoteInput');
        noteInput.value = userData.note;

        // 2. Выставляем ранг
        const rankBtns = document.querySelectorAll('.rank-opt');
        rankBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.value === userData.rank) btn.classList.add('active');
            
            // Клик по рангу
            btn.onclick = () => {
                rankBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                updateRankWatermark(btn.dataset.value);
            };
        });
        updateRankWatermark(userData.rank);

        // 3. Кнопки Сохранить / Удалить
        const saveBtn = document.getElementById('saveBtn');
        const delBtn = document.getElementById('deleteBtn');
        
        // Если запись уже есть, показываем кнопку Удалить
        delBtn.style.display = userLibrary[title] ? 'block' : 'none';

        // ЛОГИКА СОХРАНЕНИЯ
        saveBtn.onclick = () => {
            const selectedRank = document.querySelector('.rank-opt.active')?.dataset.value || 'N';
            const userNote = noteInput.value;

            // Сохраняем в объект
            userLibrary[title] = {
                rank: selectedRank,
                note: userNote,
                timestamp: Date.now()
            };

            // Пишем в LocalStorage
            localStorage.setItem(STORAGE_KEY, JSON.stringify(userLibrary));
            
            showToast('RECORD SAVED');
            modal.classList.remove('active');
            renderContent();
        };

        // ЛОГИКА УДАЛЕНИЯ
        delBtn.onclick = () => {
            if(confirm('DELETE RECORD FROM ARCHIVE?')) {
                delete userLibrary[title];
                localStorage.setItem(STORAGE_KEY, JSON.stringify(userLibrary));
                showToast('RECORD DELETED');
                modal.classList.remove('active');
                renderContent();
            }
        };

        modal.classList.add('active');
    };

    function updateRankWatermark(rank) {
        const wm = document.getElementById('modalBgRank');
        if(wm) {
            wm.textContent = rank;
            wm.style.color = (rank === 'UR') ? 'var(--gold)' : (rank === 'SSR' ? 'var(--cyan)' : 'rgba(255,255,255,0.05)');
        }
    }

    // --- 4. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---
    
    function showToast(msg) {
        const toast = document.getElementById('sysToast');
        if(!toast) return;
        toast.querySelector('.toast-msg').textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2000);
    }

    function generateTagMatrix(items) {
        const container = document.getElementById('filterOptions');
        const clearBtn = document.getElementById('clearTagsBtn');
        if(!container) return;

        const tags = new Set();
        items.forEach(i => i.tags.split(',').forEach(t => tags.add(t.trim())));
        
        container.innerHTML = Array.from(tags).sort().map(t => 
            `<button class="tag-btn" data-tag="${t}">${t}</button>`
        ).join('');

        container.querySelectorAll('.tag-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tag = btn.dataset.tag;
                if(activeTags.has(tag)) { activeTags.delete(tag); btn.classList.remove('active'); }
                else { activeTags.add(tag); btn.classList.add('active'); }
                clearBtn.style.display = activeTags.size ? 'block' : 'none';
                renderContent();
            });
        });
        
        if(clearBtn) {
            clearBtn.onclick = () => {
                activeTags.clear();
                container.querySelectorAll('.tag-btn').forEach(b => b.classList.remove('active'));
                clearBtn.style.display = 'none';
                renderContent();
            }
        }
    }

    function initInterface() {
        // Переключатель режимов
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentMode = btn.dataset.mode;
                renderContent();
            });
        });

        // Поиск
        document.getElementById('searchInput')?.addEventListener('input', renderContent);

        // Модалка
        const modal = document.getElementById('detailModal');
        if(modal) {
            document.getElementById('closeModal').onclick = () => modal.classList.remove('active');
            modal.onclick = (e) => { if(e.target === modal) modal.classList.remove('active'); };
            document.onkeydown = (e) => { if(e.key === 'Escape') modal.classList.remove('active'); };
        }

        // Анимация заголовка
        const h1 = document.querySelector('.page-header h1');
        if(h1) {
            const txt = h1.innerText;
            const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            let i = 0;
            let timer = setInterval(() => {
                h1.innerText = txt.split("").map((l, idx) => {
                    if (idx < i) return txt[idx];
                    return chars[Math.floor(Math.random() * chars.length)];
                }).join("");
                if(i >= txt.length) clearInterval(timer);
                i += 1/2;
            }, 30);
        }
    }
});
