document.addEventListener('DOMContentLoaded', () => {
    
    // --- КОНФИГУРАЦИЯ ---
    const pageType = document.body.getAttribute('data-page'); 
    const gridContainer = document.getElementById('cards-container');
    const STORAGE_KEY = `resonance_data_${pageType}`;
    
    // --- ДАННЫЕ ---
    let allItemsDB = [];
    let userLibrary = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    let currentMode = 'all'; 
    let activeTags = new Set();

    // --- 1. ЗАГРУЗКА ---
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

        if (currentMode === 'mine') items = items.filter(i => userLibrary[i.title]);

        const searchVal = document.getElementById('searchInput')?.value.toLowerCase().trim();
        if (searchVal) items = items.filter(i => i.title.toLowerCase().includes(searchVal));

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
            const userData = userLibrary[item.title];
            const userRank = userData ? userData.rank : null;
            
            // Если есть ранг, показываем его
            const rankHtml = userRank ? `<div class="${prefix}-rank-badge ${userRank.toLowerCase()}">${userRank}</div>` : '';
            const addedClass = userData ? 'in-lib' : '';
            
            const metaText = userData ? "LIBRARY" : "DATABASE";
            const metaColor = userData ? (pageType === 'games' ? 'var(--gold)' : 'var(--cyan)') : 'var(--text-muted)';

            return `
            <div class="${prefix}-card" onclick="openModal('${item.title.replace(/'/g, "\\'")}')">
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
                <div class="card-add-btn ${addedClass}">✓</div>
            </div>`;
        }).join('');
    }

    // --- 3. ЛОГИКА МОДАЛЬНОГО ОКНА ---
    
    // Элементы UI
    const els = {
        modal: document.getElementById('detailModal'),
        viewMode: document.getElementById('viewMode'),
        editMode: document.getElementById('editMode'),
        sysLabel: document.getElementById('sysModeLabel'),
        
        // Кнопки
        btnAdd: document.getElementById('btnAddLib'),
        grpActions: document.getElementById('libActions'),
        btnEdit: document.getElementById('btnEdit'),
        btnDelete: document.getElementById('btnDelete'),
        btnSave: document.getElementById('btnSave'),
        btnCancel: document.getElementById('btnCancel'),

        // Поля ввода
        noteInput: document.getElementById('userNoteInput'),
        rankBtns: document.querySelectorAll('.rank-opt'),
        
        // Поля просмотра
        viewRank: document.getElementById('viewRankDisplay'),
        viewNote: document.getElementById('viewNoteDisplay'),
        bgRank: document.getElementById('modalBgRank')
    };

    let currentItemTitle = null;

    // Открыть окно (Всегда в режиме просмотра)
    window.openModal = function(title) {
        currentItemTitle = title;
        const item = allItemsDB.find(i => i.title === title);
        
        // Заполняем статику
        document.getElementById('modalImg').src = item.image;
        document.getElementById('modalTitle').textContent = item.title;
        document.getElementById('modalDev').textContent = item.dev;
        document.getElementById('modalPlatform').textContent = item.platform;
        
        const tagsBox = document.getElementById('modalTags');
        tagsBox.innerHTML = item.tags.split(',').map(t => `<span class="tech-tag">${t.trim()}</span>`).join('');

        // Проверяем данные пользователя
        updateViewModeUI();
        
        // Сбрасываем на View Mode
        switchMode('view');
        els.modal.classList.add('active');
    };

    // Обновление данных в режиме просмотра
    function updateViewModeUI() {
        const userData = userLibrary[currentItemTitle];

        if (userData) {
            // Игра есть в библиотеке
            els.btnAdd.style.display = 'none';
            els.grpActions.style.display = 'flex';
            
            els.viewRank.textContent = userData.rank;
            els.viewRank.style.color = getRankColor(userData.rank);
            els.bgRank.textContent = userData.rank;
            els.bgRank.style.color = getRankColor(userData.rank);
            
            els.viewNote.textContent = userData.note || "No notes recorded.";
            els.viewNote.style.color = userData.note ? "#fff" : "#666";
        } else {
            // Игры нет в библиотеке
            els.btnAdd.style.display = 'block';
            els.grpActions.style.display = 'none';
            
            els.viewRank.textContent = "N/A";
            els.viewRank.style.color = "#666";
            els.bgRank.textContent = "";
            els.viewNote.textContent = "Item not in collection. Add to library to edit.";
        }
    }

    // Переключение режимов (View <-> Edit)
    function switchMode(mode) {
        if (mode === 'view') {
            els.viewMode.style.display = 'flex';
            els.editMode.style.display = 'none';
            els.sysLabel.textContent = "/// VIEW_MODE";
            els.sysLabel.style.color = "var(--text-muted)";
        } else {
            // Подготовка Edit Mode
            const userData = userLibrary[currentItemTitle] || { rank: 'N', note: '' };
            
            els.noteInput.value = userData.note;
            
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

    // --- ОБРАБОТЧИКИ КНОПОК ---

    // 1. ADD TO LIBRARY (Из View Mode)
    if(els.btnAdd) els.btnAdd.onclick = () => {
        // Создаем дефолтную запись
        userLibrary[currentItemTitle] = { rank: 'N', note: '', timestamp: Date.now() };
        saveToStorage();
        showToast('ADDED TO LIBRARY');
        updateViewModeUI(); // Обновляем UI, теперь появятся кнопки Edit/Delete
        renderContent();    // Обновляем сетку на фоне
    };

    // 2. MODIFY RECORD (Переход в Edit Mode)
    if(els.btnEdit) els.btnEdit.onclick = () => switchMode('edit');

    // 3. CANCEL (Возврат в View Mode)
    if(els.btnCancel) els.btnCancel.onclick = () => switchMode('view');

    // 4. SAVE (Сохранение и возврат)
    if(els.btnSave) els.btnSave.onclick = () => {
        const selectedRank = document.querySelector('.rank-opt.active')?.dataset.value || 'N';
        const note = els.noteInput.value;

        userLibrary[currentItemTitle] = {
            rank: selectedRank,
            note: note,
            timestamp: Date.now()
        };
        
        saveToStorage();
        showToast('RECORD UPDATED');
        updateViewModeUI();
        switchMode('view');
        renderContent();
    };

    // 5. DELETE
    if(els.btnDelete) els.btnDelete.onclick = () => {
        if(confirm('DELETE RECORD PERMANENTLY?')) {
            delete userLibrary[currentItemTitle];
            saveToStorage();
            showToast('RECORD DELETED');
            updateViewModeUI(); // Вернется кнопка ADD
            renderContent();
        }
    };

    // Выбор ранга в форме
    els.rankBtns.forEach(btn => {
        btn.onclick = () => {
            els.rankBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        };
    });


    // --- 4. UTIL ---
    function saveToStorage() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userLibrary));
    }

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

    // --- 5. ИНИЦИАЛИЗАЦИЯ ИНТЕРФЕЙСА (Без изменений) ---
    function initInterface() {
        // Tag Matrix
        generateTagMatrix(allItemsDB);

        // Mode Switch
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentMode = btn.dataset.mode;
                renderContent();
            });
        });

        // Search
        document.getElementById('searchInput')?.addEventListener('input', renderContent);

        // Modal close
        document.getElementById('closeModal').onclick = () => els.modal.classList.remove('active');
        els.modal.onclick = (e) => { if(e.target === els.modal) els.modal.classList.remove('active'); };
        document.onkeydown = (e) => { if (e.key === 'Escape') els.modal.classList.remove('active'); };

        // Grid Controls
        const grid = document.getElementById('cards-container');
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                grid.className = `grid-cards cols-${btn.dataset.cols}`;
            });
        });
    }

    function generateTagMatrix(items) {
        const container = document.getElementById('filterOptions');
        const clearBtn = document.getElementById('clearTagsBtn');
        if(!container) return;

        const tags = new Set();
        items.forEach(i => i.tags.split(',').forEach(t => tags.add(t.trim())));
        
        container.innerHTML = Array.from(tags).sort().map(t => `<button class="tag-btn" data-tag="${t}">${t}</button>`).join('');

        container.querySelectorAll('.tag-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tag = btn.dataset.tag;
                if(activeTags.has(tag)) { activeTags.delete(tag); btn.classList.remove('active'); }
                else { activeTags.add(tag); btn.classList.add('active'); }
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
