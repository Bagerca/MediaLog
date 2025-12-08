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

    // --- 2. РЕНДЕР КАРТОЧЕК (НОВЫЙ HUD ДИЗАЙН) ---
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
            
            // HTML для ранга (флажок)
            const rankHtml = userRank 
                ? `<div class="${prefix}-rank-badge ${userRank.toLowerCase()}">${userRank}</div>` 
                : '';
            
            // Классы и контент для кнопки статуса
            const btnClass = userData ? 'status-btn active' : 'status-btn';
            const btnIcon = userData ? iconCheck : iconPlus;
            
            // Текст и цвет статуса (Meta)
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
        viewRank: document.getElementById('viewRankDisplay'), // Большой бокс ранга
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

    // Обновление View Mode (Логика цветов ранга)
    function updateViewModeUI() {
        const userData = userLibrary[currentItemTitle];
        const rankBox = els.viewRank;

        if (userData) {
            els.btnAdd.style.display = 'none';
            els.grpActions.style.display = 'flex';
            
            rankBox.textContent = userData.rank;
            
            // СБРОС СТИЛЕЙ (Базовый белый вид для N, R, SR)
            rankBox.style.color = '#fff';
            rankBox.style.borderColor = 'rgba(255,255,255,0.2)';
            rankBox.style.boxShadow = 'none';

            // ЦВЕТОВЫЕ АКЦЕНТЫ ТОЛЬКО ДЛЯ ВЫСОКИХ РАНГОВ
            if (userData.rank === 'UR') {
                rankBox.style.color = 'var(--gold)';
                rankBox.style.borderColor = 'var(--gold)';
                rankBox.style.boxShadow = '0 0 15px rgba(255, 174, 0, 0.2)';
            } else if (userData.rank === 'SSR') {
                rankBox.style.color = 'var(--cyan)';
                rankBox.style.borderColor = 'var(--cyan)';
                rankBox.style.boxShadow = '0 0 15px rgba(95, 251, 241, 0.2)';
            }
            
            els.bgRank.textContent = userData.rank; // Фоновая буква
            
            els.viewNote.textContent = userData.note || "No notes recorded.";
            els.viewNote.style.color = userData.note ? "#ccc" : "#666";
        } else {
            // Если нет в библиотеке
            els.btnAdd.style.display = 'block';
            els.grpActions.style.display = 'none';
            
            rankBox.textContent = "N/A";
            rankBox.style.color = "#666";
            rankBox.style.borderColor = "rgba(255,255,255,0.1)";
            rankBox.style.boxShadow = "none";
            
            els.bgRank.textContent = "";
            els.viewNote.textContent = "Item not in collection. Add to library to edit.";
        }
    }

    // Переключение режимов (View / Edit)
    function switchMode(mode) {
        if (mode === 'view') {
            els.viewMode.style.display = 'flex';
            els.editMode.style.display = 'none';
            els.sysLabel.textContent = "/// SYSTEM: VIEW_MODE";
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
            els.sysLabel.textContent = "/// SYSTEM: EDITING_MODE";
            els.sysLabel.style.color = (pageType === 'games') ? "var(--gold)" : "var(--cyan)";
        }
    }

    // Обработчики кнопок
    if(els.btnAdd) els.btnAdd.onclick = () => {
        userLibrary[currentItemTitle] = { rank: 'N', note: '', timestamp: Date.now() };
        saveToStorage();
        showToast('RECORD INITIALIZED');
        updateViewModeUI();
        renderContent(); // Обновляем галочку на карточке
    };

    if(els.btnEdit) els.btnEdit.onclick = () => switchMode('edit');
    if(els.btnCancel) els.btnCancel.onclick = () => switchMode('view');

    if(els.btnSave) els.btnSave.onclick = () => {
        const selectedRank = document.querySelector('.rank-opt.active')?.dataset.value || 'N';
        const note = els.noteInput.value;
        userLibrary[currentItemTitle] = { rank: selectedRank, note: note, timestamp: Date.now() };
        saveToStorage();
        showToast('DATA LOG UPDATED');
        updateViewModeUI();
        switchMode('view');
        renderContent(); // Обновляем ранг на карточке
    };

    if(els.btnDelete) els.btnDelete.onclick = () => {
        if(confirm('DELETE RECORD PERMANENTLY?')) {
            delete userLibrary[currentItemTitle];
            saveToStorage();
            showToast('RECORD DELETED');
            updateViewModeUI();
            renderContent(); // Обновляем статус на карточке
            els.modal.classList.remove('active');
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
        els.modal.onclick = (e) => { 
            // Кликаем по оверлею (но не по wrapper/clipper)
            if(e.target === els.modal || e.target.classList.contains('modal-window-wrapper')) {
                 els.modal.classList.remove('active');
            }
        };
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
        
        // Хакерская анимация заголовка
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
