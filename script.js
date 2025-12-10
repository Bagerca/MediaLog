/* --- script.js --- */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- КОНФИГУРАЦИЯ ---
    const pageType = document.body.getAttribute('data-page'); 
    const gridContainer = document.getElementById('cards-container');
    const STORAGE_KEY = `resonance_data_${pageType}_v2`;
    const GRID_PREF_KEY = 'resonance_grid_density'; 
    
    // Элементы UI
    const ctxMenu = document.getElementById('ctxMenu');
    const ctxEdit = document.getElementById('ctxEdit');
    const ctxFav = document.getElementById('ctxFav');
    const ctxDel = document.getElementById('ctxDel');
    const filterBtn = document.getElementById('favFilterBtn');

    // SVG ИКОНКИ
    const ICON_STAR = `<path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>`;
    const ICON_HIDE = `<path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>`;

    let contextTargetId = null;

    // --- БЕЛЫЙ СПИСОК ТЕГОВ (ТОП-100) ---
    const WHITELIST_TAGS = [
        // --- PERSPECTIVE & TECH ---
        "2D", "3D", "VR", "First-Person", "Third-Person", "Isometric", 
        "Top-Down", "Side Scroller", "Open World", "Sandbox",

        // --- CORE GENRES ---
        "Action", "RPG", "Shooter", "Strategy", "Adventure", "Simulation", 
        "Puzzle", "Platformer", "Horror", "Racing", "Fighting", "Sports",

        // --- ACTION & SHOOTER SUB-GENRES ---
        "FPS", "TPS", "Battle Royale", "Hero Shooter", "Tactical", 
        "Hack and Slash", "Beat 'em up", "Stealth", "Survival", 
        "Metroidvania", "Bullet Hell", "Shoot 'em up",

        // --- RPG & STRATEGY SUB-GENRES ---
        "JRPG", "CRPG", "ARPG", "Turn-Based", "RTS", "Tactical RPG", 
        "Grand Strategy", "4X", "City Builder", "Management", 
        "Tower Defense", "MOBA", "Card Game", "Deckbuilder", 
        "Roguelike", "Souls-like", "Dungeon Crawler",

        // --- NARRATIVE & VIBE ---
        "Story Rich", "Visual Novel", "Interactive Movie", "Choices Matter", 
        "Multiple Endings", "Linear", "Atmospheric", "Cinematic", 
        "Mystery", "Psychological", "Drama", "Comedy", "Dark", "Mature",
        "Relaxing", "Cozy", "Funny", "Short",

        // --- SETTING & THEMES ---
        "Sci-Fi", "Cyberpunk", "Steampunk", "Fantasy", "Dark Fantasy", 
        "Post-Apocalyptic", "Dystopian", "Space", "Medieval", "Noir", 
        "Lovecraftian", "Military", "Historical", "Supernatural",

        // --- ART STYLE ---
        "Pixel Art", "Anime", "Low Poly", "Voxel", "Hand-Drawn", 
        "Retro", "Minimalist", "Stylized", "Realistic",

        // --- MECHANICS ---
        "Crafting", "Building", "Physics", "Parkour", "Permadeath", 
        "Procedural Generation", "Loot", "Gacha", "Rhythm",

        // --- SOCIAL / TYPE ---
        "Indie", "AAA", "Remake", "Remaster", "Co-op", "PvP", 
        "MMO", "Local Co-op", "Split Screen", "F2P"
    ];

    // --- СОСТОЯНИЕ ---
    let allItemsDB = [];
    let userLibrary = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    
    let currentMode = 'mine'; 
    let activeTags = new Set();
    let activeRanks = new Set(['UR', 'SSR', 'SR', 'R', 'N']);
    
    let favFilterState = 0; 
    let hideOwnedState = false; 
    
    let currentSort = 'name_asc';
    const rankWeight = { 'UR': 5, 'SSR': 4, 'SR': 3, 'R': 2, 'N': 1 };

    // --- 1. ЗАГРУЗКА ДАННЫХ ---
    if (pageType && gridContainer) {
        gridContainer.innerHTML = `
            <div class="loader-wrapper">
                <div class="loader-spinner"></div>
                <div class="loader-text">/// SYSTEM: INITIALIZING DATABASE...</div>
            </div>
        `;

        setTimeout(() => {
            fetch(`${pageType}.json?v=${new Date().getTime()}`) 
                .then(res => {
                    if (!res.ok) throw new Error("HTTP error " + res.status);
                    return res.json();
                })
                .then(data => {
                    allItemsDB = data[pageType];
                    generateTagMatrix(allItemsDB);
                    initInterface();
                    updateFilterButton(); 
                    renderContent();
                })
                .catch(err => {
                    console.error("Data Load Error:", err);
                    gridContainer.innerHTML = `
                        <div class="empty-state" style="border-color: #ff4d4d; color: #ff4d4d;">
                            /// SYSTEM ERROR: CONNECTION FAILED<br>
                            <span style="font-size: 0.8em; opacity: 0.7;">Check console for details.</span>
                        </div>
                    `;
                });
        }, 300);
    } else {
        initInterface();
    }

    // --- 2. РЕНДЕР КАРТОЧЕК ---
    function renderContent() {
        if (!gridContainer) return;

        let items = [...allItemsDB]; 

        if (currentMode === 'mine') {
            items = items.filter(i => userLibrary[i.id]);
            if (favFilterState === 1) items = items.filter(i => userLibrary[i.id].isFavorite);
            else if (favFilterState === 2) items = items.filter(i => !userLibrary[i.id].isFavorite);
            items = items.filter(i => {
                const userData = userLibrary[i.id];
                if (!userData) return false; 
                return activeRanks.has(userData.rank);
            });
        } else {
            if (hideOwnedState) items = items.filter(i => !userLibrary[i.id]);
        }

        const searchVal = document.getElementById('searchInput')?.value.toLowerCase().trim();
        if (searchVal) items = items.filter(i => i.title.toLowerCase().includes(searchVal));

        if (activeTags.size > 0) {
            const tagsArr = Array.from(activeTags);
            items = items.filter(i => {
                if (!i.tags || !Array.isArray(i.tags)) return false;
                return tagsArr.some(activeTag => 
                    i.tags.some(itemTag => itemTag.toLowerCase() === activeTag.toLowerCase())
                );
            });
        }

        items.sort((a, b) => {
            const dataA = userLibrary[a.id];
            const dataB = userLibrary[b.id];
            const getRank = (data) => data ? rankWeight[data.rank] || 0 : 0;
            const getTime = (data) => data ? data.timestamp : 0;

            switch (currentSort) {
                case 'name_asc': return a.title.localeCompare(b.title);
                case 'name_desc': return b.title.localeCompare(a.title);
                case 'rank_desc': return (getRank(dataB) - getRank(dataA)) || a.title.localeCompare(b.title);
                case 'rank_asc': return (getRank(dataA) - getRank(dataB)) || a.title.localeCompare(b.title);
                case 'date_asc':
                    if (getTime(dataA) === 0) return 1; 
                    if (getTime(dataB) === 0) return -1;
                    return getTime(dataA) - getTime(dataB);
                case 'date_desc':
                default:
                    if (getTime(dataA) === 0) return 1;
                    if (getTime(dataB) === 0) return -1;
                    return getTime(dataB) - getTime(dataA); 
            }
        });

        if (items.length === 0) {
            gridContainer.innerHTML = `<div class="empty-state">NO RECORDS FOUND WITH CURRENT FILTERS</div>`;
            return;
        }

        const prefix = (pageType === 'games') ? 'game' : 'anime';
        const iconCheck = `<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`;
        const iconPlus = `<svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>`;
        const iconStar = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`;

        gridContainer.innerHTML = items.map(item => {
            const userData = userLibrary[item.id];
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
                 onclick="openModal('${item.id}')"
                 oncontextmenu="handleRightClick(event, '${item.id}')">
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
                            <span>/// ${item.id}</span>
                        </div>
                    </div>
                </div>
            </div>`;
        }).join('');
    }

    // --- 3. UI LOGIC ---
    function updateFilterButton() {
        if (!filterBtn) return;
        filterBtn.classList.remove('active', 'excluded');

        if (currentMode === 'mine') {
            filterBtn.innerHTML = `<svg viewBox="0 0 24 24">${ICON_STAR}</svg><span></span>`;
            const span = filterBtn.querySelector('span');
            if (favFilterState === 0) span.textContent = "FAV_FILTER";
            else if (favFilterState === 1) { span.textContent = "FAV_ONLY"; filterBtn.classList.add('active'); }
            else { span.textContent = "NO_FAVS"; filterBtn.classList.add('excluded'); }
        } else {
            filterBtn.innerHTML = `<svg viewBox="0 0 24 24">${ICON_HIDE}</svg><span></span>`;
            const span = filterBtn.querySelector('span');
            if (hideOwnedState) { span.textContent = "OWNED_HIDDEN"; filterBtn.classList.add('active'); }
            else span.textContent = "HIDE_OWNED";
        }
    }

    function initInterface() {
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentMode = btn.dataset.mode;
                updateFilterButton();
                renderContent();
            });
        });

        if(filterBtn) {
            filterBtn.addEventListener('click', () => {
                if (currentMode === 'mine') favFilterState = (favFilterState + 1) % 3;
                else hideOwnedState = !hideOwnedState;
                updateFilterButton();
                renderContent();
            });
        }

        document.getElementById('searchInput')?.addEventListener('input', renderContent);

        const customWrapper = document.getElementById('customSelectWrapper');
        if (customWrapper) {
            const selectedDiv = customWrapper.querySelector('.select-selected');
            const itemsDiv = customWrapper.querySelector('.select-items');
            const optionDivs = customWrapper.querySelectorAll('.select-item');
            const nativeSelect = document.getElementById('sortSelect');

            selectedDiv.addEventListener('click', (e) => {
                e.stopPropagation();
                itemsDiv.classList.toggle('select-show');
                selectedDiv.classList.toggle('select-arrow-active');
            });

            optionDivs.forEach(div => {
                div.addEventListener('click', (e) => {
                    const val = div.getAttribute('data-value');
                    selectedDiv.textContent = div.textContent;
                    optionDivs.forEach(d => d.classList.remove('same-as-selected'));
                    div.classList.add('same-as-selected');
                    currentSort = val;
                    if(nativeSelect) nativeSelect.value = val;
                    itemsDiv.classList.remove('select-show');
                    selectedDiv.classList.remove('select-arrow-active');
                    renderContent();
                });
            });

            document.addEventListener('click', (e) => {
                if (!customWrapper.contains(e.target)) {
                    itemsDiv.classList.remove('select-show');
                    selectedDiv.classList.remove('select-arrow-active');
                }
            });
        }

        document.querySelectorAll('.rank-filter-btn').forEach(btn => {
            btn.classList.add('active');
            btn.addEventListener('click', () => {
                const rank = btn.dataset.rank;
                if (activeRanks.has(rank)) { activeRanks.delete(rank); btn.classList.remove('active'); }
                else { activeRanks.add(rank); btn.classList.add('active'); }
                renderContent();
            });
        });

        const grid = document.getElementById('cards-container');
        const viewBtns = document.querySelectorAll('.view-btn');
        let savedCols = localStorage.getItem(GRID_PREF_KEY) || '5';
        if(grid) grid.className = `grid-cards cols-${savedCols}`;
        viewBtns.forEach(btn => {
            if(btn.dataset.cols === savedCols) btn.classList.add('active');
            else btn.classList.remove('active');
            btn.addEventListener('click', () => {
                viewBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const cols = btn.dataset.cols;
                if(grid) grid.className = `grid-cards cols-${cols}`;
                localStorage.setItem(GRID_PREF_KEY, cols);
            });
        });

        document.addEventListener('click', () => { if(ctxMenu) ctxMenu.style.display = 'none'; });
        document.getElementById('closeModal').onclick = () => els.modal.classList.remove('active');
        els.modal.onclick = (e) => { if(e.target === els.modal || e.target.classList.contains('modal-window-wrapper')) els.modal.classList.remove('active'); };
        document.onkeydown = (e) => { if (e.key === 'Escape') els.modal.classList.remove('active'); };

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

    // --- 4. CONTEXT MENU & MODAL ---
    window.handleRightClick = function(e, id) {
        if (!userLibrary[id]) return; 
        e.preventDefault(); 
        contextTargetId = id; 
        const x = e.pageX; const y = e.pageY;
        ctxMenu.style.left = `${x}px`; ctxMenu.style.top = `${y}px`;
        ctxMenu.style.display = 'flex';
    };

    if(ctxEdit) ctxEdit.onclick = () => { openModal(contextTargetId); setTimeout(() => switchMode('edit'), 50); };
    if(ctxFav) ctxFav.onclick = () => {
        const item = userLibrary[contextTargetId];
        if(item) {
            item.isFavorite = !item.isFavorite;
            saveToStorage(); renderContent();
            showToast(item.isFavorite ? 'ADDED TO FAVORITES' : 'REMOVED FROM FAVORITES');
        }
    };
    if(ctxDel) ctxDel.onclick = () => {
        if(confirm(`DELETE RECORD FROM DATABASE?`)) {
            delete userLibrary[contextTargetId];
            saveToStorage(); renderContent(); showToast('RECORD DELETED');
        }
    };

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

    let currentItemId = null;

    window.openModal = function(id) {
        currentItemId = id;
        const item = allItemsDB.find(i => i.id === id);
        if (!item) return;

        document.getElementById('modalImg').src = item.image;
        document.getElementById('modalTitle').textContent = item.title;
        document.getElementById('modalDev').textContent = item.id; 
        document.getElementById('modalPlatform').textContent = `${item.platform} // ${item.dev}`; 

        const tagsBox = document.getElementById('modalTags');
        if (Array.isArray(item.tags)) {
            tagsBox.innerHTML = item.tags.map(t => `<span class="tech-tag">${t.trim()}</span>`).join('');
        } else {
            tagsBox.innerHTML = '';
        }

        updateViewModeUI();
        switchMode('view');
        els.modal.classList.add('active');
    };

    function updateViewModeUI() {
        const userData = userLibrary[currentItemId];
        const rankBox = els.viewRank;
        const rankConfig = { 'UR': 'var(--gold)', 'SSR': 'var(--cyan)', 'SR': '#00ff9d', 'R': '#ff8e3c', 'N': '#ff003c' };

        if (userData) {
            els.btnAdd.style.display = 'none';
            els.grpActions.style.display = 'flex';
            const color = rankConfig[userData.rank] || rankConfig['N'];
            rankBox.textContent = userData.rank;
            rankBox.style.color = color;
            if(els.bgRank) { els.bgRank.textContent = userData.rank; els.bgRank.style.color = color; }
            els.viewNote.textContent = userData.note || "No notes recorded.";
            els.viewNote.style.color = userData.note ? "#ccc" : "#666";
        } else {
            els.btnAdd.style.display = 'block';
            els.grpActions.style.display = 'none';
            rankBox.textContent = "N/A";
            rankBox.style.color = "#666";
            if(els.bgRank) els.bgRank.textContent = "";
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
            const userData = userLibrary[currentItemId] || { rank: 'N', note: '', customStatus: '' };
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

    if(els.btnAdd) els.btnAdd.onclick = () => {
        userLibrary[currentItemId] = { rank: 'N', note: '', customStatus: '', isFavorite: false, timestamp: Date.now() };
        saveToStorage(); updateViewModeUI(); renderContent(); switchMode('edit'); showToast('ENTRY CREATED // INPUT DETAILS');
    };
    if(els.btnEdit) els.btnEdit.onclick = () => switchMode('edit');
    if(els.btnCancel) els.btnCancel.onclick = () => switchMode('view');
    if(els.btnSave) els.btnSave.onclick = () => {
        const selectedRank = document.querySelector('.rank-opt.active')?.dataset.value || 'N';
        const note = els.noteInput.value;
        const customStatus = els.statusInput.value.trim();
        const oldData = userLibrary[currentItemId] || {};
        userLibrary[currentItemId] = { ...oldData, rank: selectedRank, note: note, customStatus: customStatus, timestamp: Date.now() };
        saveToStorage(); showToast('DATA LOG UPDATED'); updateViewModeUI(); switchMode('view'); renderContent();
    };
    if(els.btnDelete) els.btnDelete.onclick = () => {
        if(confirm('DELETE RECORD PERMANENTLY?')) {
            delete userLibrary[currentItemId];
            saveToStorage(); showToast('RECORD DELETED'); updateViewModeUI(); renderContent(); els.modal.classList.remove('active');
        }
    };
    els.rankBtns.forEach(btn => { btn.onclick = () => { els.rankBtns.forEach(b => b.classList.remove('active')); btn.classList.add('active'); }; });

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
        
        const availableTags = new Set();
        items.forEach(i => {
            if (Array.isArray(i.tags)) {
                i.tags.forEach(t => {
                    const normalizedTag = WHITELIST_TAGS.find(wt => wt.toLowerCase() === t.trim().toLowerCase());
                    if (normalizedTag) {
                        availableTags.add(normalizedTag);
                    }
                });
            }
        });

        container.innerHTML = Array.from(availableTags).sort().map(t => `<button class="tag-btn" data-tag="${t}">${t}</button>`).join('');
        
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
