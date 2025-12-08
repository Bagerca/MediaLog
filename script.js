/* --- script.js --- */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- КОНФИГУРАЦИЯ ---
    const pageType = document.body.getAttribute('data-page'); 
    const gridContainer = document.getElementById('cards-container');
    const STORAGE_KEY = `resonance_data_${pageType}`;
    const GRID_PREF_KEY = 'resonance_grid_density'; // Ключ для настройки сетки
    
    // Элементы контекстного меню
    const ctxMenu = document.getElementById('ctxMenu');
    const ctxEdit = document.getElementById('ctxEdit');
    const ctxFav = document.getElementById('ctxFav');
    const ctxDel = document.getElementById('ctxDel');
    
    let contextTargetTitle = null;

    // --- СОСТОЯНИЕ ---
    let allItemsDB = [];
    let userLibrary = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    
    // Состояние фильтров
    let currentMode = 'mine'; 
    let activeTags = new Set();
    let activeRanks = new Set();
    let onlyFavorites = false;
    let currentSort = 'date_desc';

    // Веса рангов
    const rankWeight = { 'UR': 5, 'SSR': 4, 'SR': 3, 'R': 2, 'N': 1 };

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

    // --- 2. РЕНДЕР КАРТОЧЕК ---
    function renderContent() {
        if (!gridContainer) return;

        let items = [...allItemsDB]; 

        // 1. Фильтр: Источник
        if (currentMode === 'mine') {
            items = items.filter(i => userLibrary[i.title]);
        }

        // 2. Фильтр: Поиск
        const searchVal = document.getElementById('searchInput')?.value.toLowerCase().trim();
        if (searchVal) items = items.filter(i => i.title.toLowerCase().includes(searchVal));

        // 3. Фильтр: Теги
        if (activeTags.size > 0) {
            const tagsArr = Array.from(activeTags);
            items = items.filter(i => {
                const iTags = (i.tags || '').toLowerCase();
                return tagsArr.some(t => iTags.includes(t.toLowerCase()));
            });
        }

        // 4. Фильтр: Избранное
        if (onlyFavorites) {
            items = items.filter(i => userLibrary[i.title] && userLibrary[i.title].isFavorite);
        }

        // 5. Фильтр: Ранги
        if (activeRanks.size > 0) {
            items = items.filter(i => {
                const userData = userLibrary[i.title];
                if (!userData) return false; 
                return activeRanks.has(userData.rank);
            });
        }

        // 6. Сортировка
        items.sort((a, b) => {
            const dataA = userLibrary[a.title];
            const dataB = userLibrary[b.title];

            switch (currentSort) {
                case 'name_asc': 
                    return a.title.localeCompare(b.title);
                case 'rank_desc':
                    var rA = dataA ? rankWeight[dataA.rank] || 0 : 0;
                    var rB = dataB ? rankWeight[dataB.rank] || 0 : 0;
                    return rB - rA; 
                case 'rank_asc':
                    var rA = dataA ? rankWeight[dataA.rank] || 0 : 0;
                    var rB = dataB ? rankWeight[dataB.rank] || 0 : 0;
                    return rA - rB; 
                case 'date_asc':
                    var dA = dataA ? dataA.timestamp : 0;
                    var dB = dataB ? dataB.timestamp : 0;
                    return dA - dB;
                case 'date_desc':
                default:
                    var dA = dataA ? dataA.timestamp : 0;
                    var dB = dataB ? dataB.timestamp : 0;
                    return dB - dA; 
            }
        });

        // Empty State
        if (items.length === 0) {
            const msg = 'NO RECORDS FOUND WITH CURRENT FILTERS';
            gridContainer.innerHTML = `<div class="empty-state">${msg}</div>`;
            return;
        }

        const prefix = (pageType === 'games') ? 'game' : 'anime';
        
        const iconCheck = `<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`;
        const iconPlus = `<svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>`;
        const iconStar = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`;

        gridContainer.innerHTML = items.map(item => {
            const userData = userLibrary[item.title];
            const userRank = userData ? userData.rank : null;
            const isFav = userData ? userData.isFavorite : false;
            
            const rankHtml = userRank ? `<div class="${prefix}-rank-badge ${userRank.toLowerCase()}">${userRank}</div>` : '';
            const favHtml = isFav ? `<div class="fav-icon">${iconStar}</div>` : '';

            let btnHtml = '';
            if (currentMode === 'all') {
                const btnClass = userData ? 'status-btn active' : 'status-btn';
                const btnIcon = userData ? iconCheck : iconPlus;
                btnHtml = `<div class="${btnClass}">${btnIcon}</div>`;
            }

            let statusText = "STATUS: MISSING";
            let statusColor = "inherit";
            if (userData) {
                const custom = userData.customStatus ? userData.customStatus.toUpperCase() : "OWNED";
                statusText = `STATUS: ${custom}`;
                statusColor = (pageType === 'games' ? 'var(--gold)' : 'var(--cyan)');
            }

            return `
            <div class="${prefix}-card" 
                 onclick="openModal('${item.title.replace(/'/g, "\\'")}')"
                 oncontextmenu="handleRightClick(event, '${item.title.replace(/'/g, "\\'")}')">
                <div class="${prefix}-card-inner">
                    <div class="${prefix}-card-img" style="background-image: url('${item.image}');"></div>
                    ${rankHtml}
                    ${favHtml}
                    ${btnHtml}
                    <div class="${prefix}-card-content">
                        <div class="card-line"></div>
                        <div class="${prefix}-card-title">${item.title}</div>
                        <div class="${prefix}-card-meta">
                            <span style="color: ${statusColor}; font-weight: 700;">${statusText}</span>
                            <span>/// ${item.platform || 'DB'}</span>
                        </div>
                    </div>
                </div>
            </div>`;
        }).join('');
    }

    // --- 3. ИНИЦИАЛИЗАЦИЯ ИНТЕРФЕЙСА ---
    function initInterface() {
        
        // 1. Переключатель режима
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentMode = btn.dataset.mode;
                renderContent();
            });
        });

        // 2. Фильтр Избранного
        const favBtn = document.getElementById('favFilterBtn');
        if(favBtn) {
            favBtn.addEventListener('click', () => {
                onlyFavorites = !onlyFavorites;
                favBtn.classList.toggle('active', onlyFavorites);
                renderContent();
            });
        }

        // 3. Поиск
        document.getElementById('searchInput')?.addEventListener('input', renderContent);

        // 4. Сортировка
        document.getElementById('sortSelect')?.addEventListener('change', (e) => {
            currentSort = e.target.value;
            renderContent();
        });

        // 5. Фильтры рангов
        document.querySelectorAll('.rank-filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const rank = btn.dataset.rank;
                if (activeRanks.has(rank)) {
                    activeRanks.delete(rank);
                    btn.classList.remove('active');
                } else {
                    activeRanks.add(rank);
                    btn.classList.add('active');
                }
                renderContent();
            });
        });

        // --- 6. НАСТРОЙКА СЕТКИ (GRID DENSITY) С ЗАПОМИНАНИЕМ ---
        const grid = document.getElementById('cards-container');
        const viewBtns = document.querySelectorAll('.view-btn');
        
        // Загружаем сохраненную настройку или ставим '5' по умолчанию
        let savedCols = localStorage.getItem(GRID_PREF_KEY) || '5';
        
        // Применяем сразу при загрузке
        if(grid) grid.className = `grid-cards cols-${savedCols}`;
        
        // Обновляем активную кнопку
        viewBtns.forEach(btn => {
            if(btn.dataset.cols === savedCols) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }

            // Обработчик клика
            btn.addEventListener('click', () => {
                // Визуальное переключение кнопок
                viewBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Применение стиля сетки
                const cols = btn.dataset.cols;
                if(grid) grid.className = `grid-cards cols-${cols}`;
                
                // Сохранение выбора в LocalStorage
                localStorage.setItem(GRID_PREF_KEY, cols);
            });
        });


        // 7. Закрытие меню
        document.addEventListener('click', () => { if(ctxMenu) ctxMenu.style.display = 'none'; });
        
        // 8. Закрытие модалки
        document.getElementById('closeModal').onclick = () => els.modal.classList.remove('active');
        els.modal.onclick = (e) => { 
            if(e.target === els.modal || e.target.classList.contains('modal-window-wrapper')) {
                 els.modal.classList.remove('active');
            }
        };
        document.onkeydown = (e) => { if (e.key === 'Escape') els.modal.classList.remove('active'); };

        // 9. Анимация заголовка
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

    // --- 4. КОНТЕКСТНОЕ МЕНЮ ---
    window.handleRightClick = function(e, title) {
        if (!userLibrary[title]) return; 
        e.preventDefault(); 
        contextTargetTitle = title; 
        const x = e.pageX; const y = e.pageY;
        ctxMenu.style.left = `${x}px`; ctxMenu.style.top = `${y}px`;
        ctxMenu.style.display = 'flex';
    };

    if(ctxEdit) ctxEdit.onclick = () => { 
        openModal(contextTargetTitle); 
        setTimeout(() => switchMode('edit'), 50); 
    };
    
    if(ctxFav) ctxFav.onclick = () => {
        const item = userLibrary[contextTargetTitle];
        if(item) {
            item.isFavorite = !item.isFavorite;
            saveToStorage(); renderContent();
            showToast(item.isFavorite ? 'ADDED TO FAVORITES' : 'REMOVED FROM FAVORITES');
        }
    };
    
    if(ctxDel) ctxDel.onclick = () => {
        if(confirm(`DELETE "${contextTargetTitle}" FROM DATABASE?`)) {
            delete userLibrary[contextTargetTitle];
            saveToStorage(); renderContent(); showToast('RECORD DELETED');
        }
    };

    // --- 5. МОДАЛЬНОЕ ОКНО ---
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
        statusInput: document.getElementById('userStatusInput'),
        rankBtns: document.querySelectorAll('.rank-opt'),
        viewRank: document.getElementById('viewRankDisplay'),
        viewNote: document.getElementById('viewNoteDisplay'),
        bgRank: document.getElementById('modalBgRank')
    };

    let currentItemTitle = null;

    window.openModal = function(title) {
        currentItemTitle = title;
        const item = allItemsDB.find(i => i.title === title);
        if (!item) return;

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

    function updateViewModeUI() {
        const userData = userLibrary[currentItemTitle];
        const rankBox = els.viewRank;

        const rankConfig = {
            'UR':  { color: 'var(--gold)', shadow: 'rgba(255, 174, 0, 0.4)' },
            'SSR': { color: 'var(--cyan)', shadow: 'rgba(95, 251, 241, 0.4)' },
            'SR':  { color: '#00ff9d',     shadow: 'rgba(0, 255, 157, 0.4)' },
            'R':   { color: '#ff8e3c',     shadow: 'rgba(255, 142, 60, 0.4)' },
            'N':   { color: '#ff003c',     shadow: 'rgba(255, 0, 60, 0.4)' }
        };

        if (userData) {
            els.btnAdd.style.display = 'none';
            els.grpActions.style.display = 'flex';
            
            const rInfo = rankConfig[userData.rank] || rankConfig['N'];
            
            rankBox.textContent = userData.rank;
            rankBox.style.color = rInfo.color;
            rankBox.style.borderColor = rInfo.color;
            rankBox.style.boxShadow = `0 0 20px ${rInfo.shadow}, inset 0 0 10px ${rInfo.shadow}`;
            rankBox.style.textShadow = `0 0 10px ${rInfo.shadow}`;
            
            els.bgRank.textContent = userData.rank;
            els.bgRank.style.color = rInfo.color;
            
            els.viewNote.textContent = userData.note || "No notes recorded.";
            els.viewNote.style.color = userData.note ? "#ccc" : "#666";
        } else {
            els.btnAdd.style.display = 'block';
            els.grpActions.style.display = 'none';
            
            rankBox.textContent = "N/A";
            rankBox.style.color = "#666";
            rankBox.style.borderColor = "rgba(255,255,255,0.1)";
            rankBox.style.boxShadow = "none";
            rankBox.style.textShadow = "none";
            
            els.bgRank.textContent = "";
            els.viewNote.textContent = "Item not in collection. Add to library to edit.";
        }
    }

    function switchMode(mode) {
        if (mode === 'view') {
            els.viewMode.style.display = 'flex';
            els.editMode.style.display = 'none';
            els.sysLabel.textContent = "/// SYSTEM: VIEW_MODE";
            els.sysLabel.style.color = "var(--text-muted)";
        } else {
            const userData = userLibrary[currentItemTitle] || { rank: 'N', note: '', customStatus: '' };
            els.noteInput.value = userData.note || '';
            els.statusInput.value = userData.customStatus || '';
            
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

    // Modal Actions
    if(els.btnAdd) els.btnAdd.onclick = () => {
        userLibrary[currentItemTitle] = { rank: 'N', note: '', customStatus: '', isFavorite: false, timestamp: Date.now() };
        saveToStorage(); updateViewModeUI(); renderContent(); switchMode('edit'); showToast('ENTRY CREATED // INPUT DETAILS');
    };
    if(els.btnEdit) els.btnEdit.onclick = () => switchMode('edit');
    if(els.btnCancel) els.btnCancel.onclick = () => switchMode('view');
    if(els.btnSave) els.btnSave.onclick = () => {
        const selectedRank = document.querySelector('.rank-opt.active')?.dataset.value || 'N';
        const note = els.noteInput.value;
        const customStatus = els.statusInput.value.trim();
        const oldData = userLibrary[currentItemTitle] || {};
        userLibrary[currentItemTitle] = { ...oldData, rank: selectedRank, note: note, customStatus: customStatus, timestamp: Date.now() };
        saveToStorage(); showToast('DATA LOG UPDATED'); updateViewModeUI(); switchMode('view'); renderContent();
    };
    if(els.btnDelete) els.btnDelete.onclick = () => {
        if(confirm('DELETE RECORD PERMANENTLY?')) {
            delete userLibrary[currentItemTitle];
            saveToStorage(); showToast('RECORD DELETED'); updateViewModeUI(); renderContent(); els.modal.classList.remove('active');
        }
    };
    els.rankBtns.forEach(btn => {
        btn.onclick = () => {
            els.rankBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        };
    });

    function saveToStorage() { localStorage.setItem(STORAGE_KEY, JSON.stringify(userLibrary)); }
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
        items.forEach(i => (i.tags || '').split(',').forEach(t => tags.add(t.trim())));
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
