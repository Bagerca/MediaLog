/* --- script.js --- */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- КОНФИГУРАЦИЯ ---
    const pageType = document.body.getAttribute('data-page'); 
    const gridContainer = document.getElementById('cards-container');
    const STORAGE_KEY = `resonance_data_${pageType}`;
    
    // --- СОСТОЯНИЕ ---
    let allItemsDB = [];
    let userLibrary = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    let currentMode = 'mine'; // 'mine' или 'all'
    let activeTags = new Set();

    // --- 1. ЗАГРУЗКА ДАННЫХ ---
    if (pageType && gridContainer) {
        fetch('data.json')
            .then(res => res.json())
            .then(data => {
                allItemsDB = data[pageType];
                generateTagMatrix(allItemsDB);
                initInterface();
                renderContent();
            })
            .catch(err => console.error("Data Load Error:", err));
    } else {
        initInterface();
    }

    // --- 2. РЕНДЕР КАРТОЧЕК (ОБНОВЛЕННЫЙ HUD ДИЗАЙН) ---
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

        // Сообщение если пусто
        if (items.length === 0) {
            const msg = currentMode === 'mine' 
                ? 'COLLECTION EMPTY /// SWITCH TO GLOBAL_DB TO ADD ITEMS' 
                : 'NO DATA FOUND IN DATABASE';
            gridContainer.innerHTML = `<div class="empty-state">${msg}</div>`;
            return;
        }

        // Определяем префикс класса (game или anime)
        const prefix = (pageType === 'games') ? 'game' : 'anime';
        
        // SVG Иконки
        const iconCheck = `<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`;
        const iconPlus = `<svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>`;

        gridContainer.innerHTML = items.map(item => {
            const userData = userLibrary[item.title];
            const userRank = userData ? userData.rank : null;
            
            // HTML для ранга (если он есть)
            const rankHtml = userRank 
                ? `<div class="${prefix}-rank-badge ${userRank.toLowerCase()}">${userRank}</div>` 
                : '';
            
            // Классы и контент для кнопки статуса
            const btnClass = userData ? 'status-btn active' : 'status-btn';
            const btnIcon = userData ? iconCheck : iconPlus;
            
            // Текст и цвет статуса
            const statusText = userData ? "STATUS: OWNED" : "STATUS: MISSING";
            // Для игр - золото, для аниме - циан (если в коллекции)
            const statusColor = userData 
                ? (pageType === 'games' ? 'var(--gold)' : 'var(--cyan)') 
                : 'inherit';

            return `
            <div class="${prefix}-card" onclick="openModal('${item.title.replace(/'/g, "\\'")}')">
                <div class="${prefix}-card-inner">
                    <div class="${prefix}-card-img" style="background-image: url('${item.image}');"></div>
                    
                    ${rankHtml}
                    
                    <div class="${btnClass}">
                        ${btnIcon}
                    </div>

                    <div class="${prefix}-card-content">
                        <div class="card-line"></div>
                        <div class="${prefix}-card-title">${item.title}</div>
                        <div class="${prefix}-card-meta">
                            <span style="color: ${statusColor};">${statusText}</span>
                            <span>/// ${item.platform || 'DB'}</span>
                        </div>
                    </div>
                </div>
            </div>`;
        }).join('');
    }

    // --- 3. ЛОГИКА МОДАЛЬНОГО ОКНА ---
    
    const els = {
        modal: document.getElementById('detailModal'),
        viewMode: document.getElementById('viewMode'),
        editMode: document.getElementById('editMode'),
        sysLabel: document.getElementById('sysModeLabel'),
        btnAdd: document.getElementById('btnAddLib'),
        grpActions: document.getElementById('libActions'),
        btnEdit: document.getElementById('btnEdit'),
        btnDelete: document.getElementById('btnDelete'),
        btnSave: document.getElementById('btnSave'),
        btnCancel: document.getElementById('btnCancel'),
        noteInput: document.getElementById('userNoteInput'),
        rankBtns: document.querySelectorAll('.rank-opt'),
        viewRank: document.getElementById('viewRankDisplay'),
        viewNote: document.getElementById('viewNoteDisplay'),
        bgRank: document.getElementById('modalBgRank')
    };

    let currentItemTitle = null;

    // Открыть окно
    window.openModal = function(title) {
        currentItemTitle = title;
        const item = allItemsDB.find(i => i.title === title);
        
        if (!item) return;

        // Заполняем статику
        document.getElementById('modalImg').src = item.image;
        document.getElementById('modalTitle').textContent = item.title;
        document.getElementById('modalDev').textContent = item.dev || 'UNKNOWN';
        document.getElementById('modalPlatform').textContent = item.platform || 'N/A';
        
        const tagsBox = document.getElementById('modalTags');
        tagsBox.innerHTML = item.tags.split(',').map(t => `<span class="tech-tag">${t.trim()}</span>`).join('');

        updateViewModeUI();
        switchMode('view');
        els.modal.classList.add('active');
    };

    // Обновление View Mode
    function updateViewModeUI() {
        const userData = userLibrary[currentItemTitle];

        if (userData) {
            els.btnAdd.style.display = 'none';
            els.grpActions.style.display = 'flex';
            
            els.viewRank.textContent = userData.rank;
            els.viewRank.style.color = getRankColor(userData.rank);
            els.bgRank.textContent = userData.rank;
            els.bgRank.style.color = getRankColor(userData.rank);
            
            els.viewNote.textContent = userData.note || "No notes recorded.";
            els.viewNote.style.color = userData.note ? "#fff" : "#666";
        } else {
            els.btnAdd.style.display = 'block';
            els.grpActions.style.display = 'none';
            
            els.viewRank.textContent = "N/A";
            els.viewRank.style.color = "#666";
            els.bgRank.textContent = "";
            els.viewNote.textContent = "Item not in collection. Add to library to edit.";
        }
    }

    // Переключение режимов (View / Edit)
    function switchMode(mode) {
        if (mode === 'view') {
            els.viewMode.style.display = 'flex';
            els.editMode.style.display = 'none';
            els.sysLabel.textContent = "/// VIEW_MODE";
            els.sysLabel.style.color = "var(--text-muted)";
        } else {
            const userData = userLibrary[currentItemTitle] || { rank: 'N', note: '' };
            els.noteInput.value = userData.note;
            
            // Сброс и установка активной кнопки ранга
            els.rankBtns.forEach(btn => {
                btn.classList.remove('active');
                if(btn.dataset.value === userData.rank) btn.classList.add('active');
            });
            
            els.viewMode.style.display = 'none';
            els.editMode.style.display = 'flex';
            els.sysLabel.textContent = "/// EDITING_MODE";
            els.sysLabel.style.color = (pageType === 'games') ? "var(--gold)" : "var(--cyan)";
        }
    }

    // Обработчики кнопок
    if(els.btnAdd) els.btnAdd.onclick = () => {
        userLibrary[currentItemTitle] = { rank: 'N', note: '', timestamp: Date.now() };
        saveToStorage();
        showToast('ADDED TO LIBRARY');
        updateViewModeUI();
        renderContent(); // Перерисовка карточек, чтобы обновилась галочка
    };

    if(els.btnEdit) els.btnEdit.onclick = () => switchMode('edit');
    if(els.btnCancel) els.btnCancel.onclick = () => switchMode('view');

    if(els.btnSave) els.btnSave.onclick = () => {
        const selectedRank = document.querySelector('.rank-opt.active')?.dataset.value || 'N';
        const note = els.noteInput.value;
        userLibrary[currentItemTitle] = { rank: selectedRank, note: note, timestamp: Date.now() };
        saveToStorage();
        showToast('RECORD UPDATED');
        updateViewModeUI();
        switchMode('view');
        renderContent(); // Перерисовка, чтобы обновился ранг на карточке
    };

    if(els.btnDelete) els.btnDelete.onclick = () => {
        if(confirm('DELETE RECORD PERMANENTLY?')) {
            delete userLibrary[currentItemTitle];
            saveToStorage();
            showToast('RECORD DELETED');
            updateViewModeUI();
            renderContent(); // Перерисовка
            els.modal.classList.remove('active'); // Закрываем модалку после удаления
        }
    };

    // Выбор ранга в режиме редактирования
    els.rankBtns.forEach(btn => {
        btn.onclick = () => {
            els.rankBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        };
    });

    // --- UTILS ---
    function saveToStorage() { localStorage.setItem(STORAGE_KEY, JSON.stringify(userLibrary)); }
    
    function getRankColor(rank) {
        if (rank === 'UR') return 'var(--gold)';
        if (rank === 'SSR') return 'var(--cyan)';
        return 'rgba(255,255,255,0.1)';
    }
    
    function showToast(msg) {
        const toast = document.getElementById('sysToast');
        if(!toast) return;
        toast.querySelector('.toast-msg').textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2000);
    }

    // --- ИНИЦИАЛИЗАЦИЯ ИНТЕРФЕЙСА ---
    function initInterface() {
        // Переключатель Global DB / My Collection
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

        // Управление модальным окном
        document.getElementById('closeModal').onclick = () => els.modal.classList.remove('active');
        els.modal.onclick = (e) => { if(e.target === els.modal) els.modal.classList.remove('active'); };
        document.onkeydown = (e) => { if (e.key === 'Escape') els.modal.classList.remove('active'); };

        // Переключение колонок
        const grid = document.getElementById('cards-container');
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                if(grid) grid.className = `grid-cards cols-${btn.dataset.cols}`;
            });
        });
        
        // Хакерская анимация заголовка (эффект расшифровки)
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

    // Генерация кнопок тегов
    function generateTagMatrix(items) {
        const container = document.getElementById('filterOptions');
        const clearBtn = document.getElementById('clearTagsBtn');
        if(!container) return;

        const tags = new Set();
        items.forEach(i => (i.tags || '').split(',').forEach(t => tags.add(t.trim())));
        
        container.innerHTML = Array.from(tags).sort().map(t => `<button class="tag-btn" data-tag="${t}">${t}</button>`).join('');

        container.querySelectorAll('.tag-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tag = btn.dataset.tag;
                if(activeTags.has(tag)) { 
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
        
        if(clearBtn) clearBtn.onclick = () => {
            activeTags.clear();
            container.querySelectorAll('.tag-btn').forEach(b => b.classList.remove('active'));
            clearBtn.style.display = 'none';
            renderContent();
        }
    }
});
