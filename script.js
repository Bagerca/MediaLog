document.addEventListener('DOMContentLoaded', () => {
    
    // 0. КОНФИГУРАЦИЯ
    const pageType = document.body.getAttribute('data-page'); 
    const gridContainer = document.getElementById('cards-container');
    
    // 1. ЗАГРУЗКА
    if (pageType && gridContainer) {
        fetch('data.json')
            .then(response => response.json())
            .then(data => {
                const items = data[pageType];
                renderCards(items, pageType); 
                generateFilters(items); 
                initInterface(pageType); 
            })
            .catch(err => console.error('DB Error:', err));
    } else {
        initInterface(null);
    }

    // 2. РЕНДЕР КАРТОЧЕК
    function renderCards(items, type) {
        if (!items) return;
        
        // Определяем префикс класса (game или anime)
        const prefix = (type === 'games') ? 'game' : 'anime';

        gridContainer.innerHTML = items.map(item => {
            const metaColor = (item.rank === 'UR') ? 'var(--gold)' : 
                              (item.rank === 'SSR') ? 'var(--cyan)' : 'var(--text-muted)';
            
            // Сохраняем все данные в dataset
            return `
            <div class="${prefix}-card" 
                 data-title="${item.title}"
                 data-desc="${item.desc}"
                 data-tags="${item.tags}"
                 data-platform="${item.platform}"
                 data-dev="${item.dev}"
                 data-rank="${item.rank}"
                 data-img="${item.image}"> 
                
                <div class="${prefix}-card-inner">
                    <div class="${prefix}-card-img" style="background-image: url('${item.image}');"></div>
                    <div class="${prefix}-rank-badge ${item.rank.toLowerCase()}">${item.rank}</div>
                    
                    <div class="${prefix}-card-content">
                        <div class="${prefix}-card-title">${item.title}</div>
                        <div class="${prefix}-card-meta">
                            <span style="color: ${metaColor}; font-weight: bold; letter-spacing: 1px;">${item.meta_highlight}</span>
                            <span>${item.meta_sub}</span>
                        </div>
                    </div>
                </div>
            </div>
            `;
        }).join('');
    }

    // 3. ФИЛЬТРЫ
    function generateFilters(items) {
        const filterContainer = document.getElementById('filterOptions');
        if (!filterContainer) return;
        const allTags = new Set();
        items.forEach(item => { if (item.tags) item.tags.split(',').forEach(t => allTags.add(t.trim())); });
        
        const sortedTags = Array.from(allTags).sort();
        let html = `<div class="option active" data-filter="all">ALL RECORDS</div>`;
        sortedTags.forEach(tag => { html += `<div class="option" data-filter="${tag}">${tag}</div>`; });
        filterContainer.innerHTML = html;
    }

    // 4. ИНТЕРФЕЙС
    function initInterface(pageType) {
        const cardSelector = pageType ? `.${(pageType === 'games' ? 'game' : 'anime')}-card` : '.card';
        const searchInput = document.getElementById('searchInput');
        
        function updateList() {
            const cards = document.querySelectorAll(cardSelector); 
            const filterVal = document.querySelector('.option.active')?.dataset.filter || 'all';
            const searchVal = searchInput ? searchInput.value.toLowerCase() : '';

            cards.forEach(card => {
                const tags = (card.dataset.tags || '').toLowerCase();
                const title = (card.dataset.title || '').toLowerCase();
                
                const matchTag = filterVal === 'all' || tags.includes(filterVal.toLowerCase());
                const matchSearch = title.includes(searchVal);

                if (matchTag && matchSearch) {
                    card.style.display = 'block';
                    setTimeout(() => card.style.opacity = '1', 50);
                } else {
                    card.style.display = 'none';
                    card.style.opacity = '0';
                }
            });
        }
        
        if(searchInput) searchInput.addEventListener('input', updateList);
        
        const dropdown = document.querySelector('.custom-dropdown');
        const trigger = dropdown?.querySelector('.dropdown-trigger');
        const opts = dropdown?.querySelectorAll('.option');
        
        if (trigger) {
            trigger.addEventListener('click', (e) => { e.stopPropagation(); dropdown.classList.toggle('open'); });
            document.addEventListener('click', () => dropdown.classList.remove('open'));
        }
        
        if (opts) {
            opts.forEach(o => o.addEventListener('click', function() {
                opts.forEach(el => el.classList.remove('active'));
                this.classList.add('active');
                dropdown.querySelector('.selected-text').textContent = (this.dataset.filter === 'all') ? 'FILTER BY TAGS' : this.textContent;
                updateList();
            }));
        }

        const viewBtns = document.querySelectorAll('.view-btn');
        const grid = document.querySelector('.grid-cards');
        viewBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                viewBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                if(grid) grid.className = `grid-cards cols-${btn.dataset.cols}`;
            });
        });

        initModal(cardSelector);
    }

    // 5. МОДАЛЬНОЕ ОКНО (С защитой от ошибок)
    function initModal(cardSelector) {
        const modal = document.getElementById('detailModal');
        const grid = document.querySelector('.grid-cards');
        if (!modal || !grid) return;

        grid.addEventListener('click', (e) => {
            const card = e.target.closest(cardSelector);
            if (!card) return;

            const d = card.dataset;
            document.getElementById('modalImg').src = d.img;
            document.getElementById('modalTitle').textContent = d.title;
            document.getElementById('modalDesc').textContent = d.desc;
            document.getElementById('modalPlatform').textContent = d.platform;
            document.getElementById('modalDev').textContent = d.dev;
            
            // Безопасное обновление ранга
            const rInfo = document.getElementById('modalRank');
            if(rInfo) {
                rInfo.textContent = d.rank;
                rInfo.style.color = (d.rank === 'UR') ? 'var(--gold)' : (d.rank === 'SSR' ? 'var(--cyan)' : 'rgba(255,255,255,0.05)');
            }

            // Безопасная обработка тегов (чтобы не падало если тегов нет)
            const tagsBox = document.getElementById('modalTags');
            if(tagsBox) {
                tagsBox.innerHTML = '';
                if (d.tags) {
                    d.tags.split(',').forEach(t => {
                        const s = document.createElement('span');
                        s.className = 'tech-tag'; s.textContent = t.trim();
                        tagsBox.appendChild(s);
                    });
                }
            }

            modal.classList.add('active');
        });

        const closeBtn = document.getElementById('closeModal');
        if(closeBtn) closeBtn.onclick = () => modal.classList.remove('active');
        
        modal.onclick = (e) => { if(e.target === modal) modal.classList.remove('active'); };
    }
});
