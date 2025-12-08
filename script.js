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
                renderCards(items, pageType); // Передаем pageType
                generateFilters(items); 
                initInterface(); 
            })
            .catch(err => console.error('DB Error:', err));
    } else {
        initInterface();
    }

    // 2. РЕНДЕР КАРТОЧЕК (ТЕПЕРЬ С ВЕТВЛЕНИЕМ)
    function renderCards(items, type) {
        if (!items) return;
        
        gridContainer.innerHTML = items.map(item => {
            // Общие данные для модального окна (data-attrs)
            const commonData = `
                data-title="${item.title}"
                data-desc="${item.desc}"
                data-tags="${item.tags}"
                data-platform="${item.platform}"
                data-dev="${item.dev}"
                data-rank="${item.rank}"
                data-img="${item.image}"
            `;

            // --- ВАРИАНТ 1: ИГРЫ (Tech Style) ---
            if (type === 'games') {
                return `
                <div class="game-card" ${commonData} data-category="${item.category}">
                    <div class="game-bg" style="background-image: url('${item.image}');"></div>
                    <div class="game-content">
                        <div class="game-header">
                            <div class="platform-badge">${item.platform}</div>
                            <div class="game-rank rank-${item.rank}">${item.rank}</div>
                        </div>
                        
                        <div class="game-main">
                            <h3>${item.title}</h3>
                            <div class="game-meta">${item.meta_highlight}</div>
                        </div>

                        <div class="game-footer">
                            <div class="status-row">
                                <span>INTEGRITY</span>
                                <span>${item.meta_sub}</span>
                            </div>
                            <div class="progress-bar">
                                <!-- Если статус ACTIVE, добавляем анимацию, иначе просто заливка -->
                                <div class="${item.meta_sub.includes('ACTIVE') ? 'loading-anim' : 'progress-fill'}"></div>
                            </div>
                        </div>
                    </div>
                </div>`;
            } 
            
            // --- ВАРИАНТ 2: АНИМЕ (Poster Style) ---
            else if (type === 'anime') {
                return `
                <div class="anime-card" ${commonData} data-category="${item.category}">
                    <div class="poster-frame">
                        <img class="poster-img" src="${item.image}" loading="lazy">
                        <div class="poster-badge bg-${item.rank}">${item.rank}</div>
                        <div class="poster-overlay">
                            <div class="play-btn">▶</div>
                        </div>
                    </div>
                    <div class="anime-info">
                        <div class="anime-title">${item.title}</div>
                        <div class="anime-meta">
                            <span>${item.meta_highlight}</span>
                            <span class="anime-status">${item.meta_sub}</span>
                        </div>
                    </div>
                </div>`;
            }
        }).join('');
    }

    // 3. ФИЛЬТРЫ (Без изменений, только селекторы классов обновлены)
    function generateFilters(items) {
        const filterContainer = document.getElementById('filterOptions');
        if (!filterContainer) return;
        const allTags = new Set();
        items.forEach(item => { if (item.tags) item.tags.split(',').forEach(t => allTags.add(t.trim())); });
        
        // ... (Код генерации опций фильтра остается прежним) ...
        const sortedTags = Array.from(allTags).sort();
        let html = `<div class="option active" data-filter="all">ALL RECORDS</div>`;
        sortedTags.forEach(tag => { html += `<div class="option" data-filter="${tag}">${tag}</div>`; });
        filterContainer.innerHTML = html;
    }

    // 4. ИНТЕРФЕЙС (Обновлен селектор карточек)
    function initInterface() {
        // ... (Анимация, Сетка, Поиск - код тот же) ...
        
        // ВАЖНО: Обновленный поиск использует .game-card ИЛИ .anime-card
        const searchInput = document.getElementById('searchInput');
        
        function updateList() {
            // Ищем любые карточки
            const cards = document.querySelectorAll('.game-card, .anime-card'); 
            const filterVal = document.querySelector('.option.active')?.dataset.filter || 'all';
            const searchVal = searchInput ? searchInput.value.toLowerCase() : '';

            cards.forEach(card => {
                const tags = (card.dataset.tags || '').toLowerCase();
                // Для поиска берем текст из data-title, так как структура HTML разная
                const title = (card.dataset.title || '').toLowerCase();
                
                const matchTag = filterVal === 'all' || tags.includes(filterVal.toLowerCase());
                const matchSearch = title.includes(searchVal);

                card.style.display = (matchTag && matchSearch) ? 'block' : 'none';
            });
        }
        
        // ... (Привязка событий к фильтрам и поиску остается прежней, вызываем updateList) ...
        // Не забудь добавить listener на searchInput и dropdown options
        if(searchInput) searchInput.addEventListener('input', updateList);
        const opts = document.querySelectorAll('.option');
        opts.forEach(o => o.addEventListener('click', function() {
            document.querySelectorAll('.option').forEach(el => el.classList.remove('active'));
            this.classList.add('active');
            updateList();
        }));

        initModal();
    }

    // 5. МОДАЛЬНОЕ ОКНО (Берет данные из data-атрибутов)
    function initModal() {
        const modal = document.getElementById('detailModal');
        const grid = document.querySelector('.grid-cards');
        if (!modal || !grid) return;

        grid.addEventListener('click', (e) => {
            const card = e.target.closest('.game-card, .anime-card');
            if (!card) return;

            // Заполняем модалку из dataset (чище и надежнее)
            const d = card.dataset;
            document.getElementById('modalImg').src = d.img;
            document.getElementById('modalTitle').textContent = d.title;
            document.getElementById('modalDesc').textContent = d.desc;
            document.getElementById('modalRank').textContent = d.rank;
            document.getElementById('modalPlatform').textContent = d.platform;
            document.getElementById('modalDev').textContent = d.dev;

            // Ранг цвет
            const rInfo = document.getElementById('modalRank');
            rInfo.style.color = (d.rank === 'UR') ? 'var(--gold)' : (d.rank === 'SSR' ? 'var(--cyan)' : '#333');

            // Теги
            const tagsBox = document.getElementById('modalTags');
            tagsBox.innerHTML = '';
            d.tags.split(',').forEach(t => {
                const s = document.createElement('span');
                s.className = 'tech-tag'; s.textContent = t.trim();
                tagsBox.appendChild(s);
            });

            modal.classList.add('active');
        });

        // Закрытие
        document.getElementById('closeModal').onclick = () => modal.classList.remove('active');
        modal.onclick = (e) => { if(e.target === modal) modal.classList.remove('active'); };
    }
});
