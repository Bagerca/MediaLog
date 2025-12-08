document.addEventListener('DOMContentLoaded', () => {
    
    // 0. КОНФИГУРАЦИЯ
    const pageType = document.body.getAttribute('data-page'); 
    const gridContainer = document.getElementById('cards-container');
    const STORAGE_KEY_COLS = 'resonance_grid_columns'; // Для сохранения выбора колонок
    
    // Хранилище активных тегов (Set гарантирует уникальность)
    let activeTags = new Set(); 

    // 1. ЗАГРУЗКА ДАННЫХ
    if (pageType && gridContainer) {
        fetch('data.json')
            .then(response => response.json())
            .then(data => {
                const items = data[pageType];
                renderCards(items, pageType); 
                generateTagMatrix(items); // Генерируем новые кнопки
                initInterface(pageType); 
            })
            .catch(err => console.error('DB Error:', err));
    } else {
        initInterface(null);
    }

    // 2. РЕНДЕР КАРТОЧЕК (Без изменений)
    function renderCards(items, type) {
        if (!items) return;
        const prefix = (type === 'games') ? 'game' : 'anime';

        gridContainer.innerHTML = items.map(item => {
            const metaColor = (item.rank === 'UR') ? 'var(--gold)' : 
                              (item.rank === 'SSR') ? 'var(--cyan)' : 'var(--text-muted)';
            
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

    // 3. ГЕНЕРАЦИЯ МАТРИЦЫ ТЕГОВ (МУЛЬТИ-ВЫБОР)
    function generateTagMatrix(items) {
        const filterContainer = document.getElementById('filterOptions');
        const clearBtn = document.getElementById('clearTagsBtn');
        if (!filterContainer) return;

        // Собираем уникальные теги
        const allTags = new Set();
        items.forEach(item => { 
            if (item.tags) item.tags.split(',').forEach(t => allTags.add(t.trim())); 
        });
        const sortedTags = Array.from(allTags).sort();

        // Создаем кнопки
        filterContainer.innerHTML = sortedTags.map(tag => 
            `<button class="tag-btn" data-tag="${tag}">${tag}</button>`
        ).join('');

        // Добавляем обработчики клика на теги
        const tagButtons = filterContainer.querySelectorAll('.tag-btn');
        tagButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tag = btn.getAttribute('data-tag');
                
                // Логика переключения
                if (activeTags.has(tag)) {
                    activeTags.delete(tag);
                    btn.classList.remove('active');
                } else {
                    activeTags.add(tag);
                    btn.classList.add('active');
                }

                // Показать/скрыть кнопку сброса
                if (clearBtn) clearBtn.style.display = activeTags.size > 0 ? 'block' : 'none';
                
                updateList(); // Обновляем сетку
            });
        });

        // Кнопка сброса (RESET)
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                activeTags.clear();
                tagButtons.forEach(b => b.classList.remove('active'));
                clearBtn.style.display = 'none';
                updateList();
            });
        }
    }

    // 4. ГЛАВНАЯ ФУНКЦИЯ ОБНОВЛЕНИЯ (ФИЛЬТР + ПОИСК)
    function updateList() {
        const pageType = document.body.getAttribute('data-page');
        const cardSelector = pageType ? `.${(pageType === 'games' ? 'game' : 'anime')}-card` : '.card';
        const cards = document.querySelectorAll(cardSelector);
        const searchInput = document.getElementById('searchInput');
        const searchVal = searchInput ? searchInput.value.toLowerCase().trim() : '';

        cards.forEach(card => {
            const cardTags = (card.dataset.tags || '').toLowerCase();
            const cardTitle = (card.dataset.title || '').toLowerCase();
            
            // 1. Проверка поиска
            const matchesSearch = cardTitle.includes(searchVal);

            // 2. Проверка тегов (Мульти-выбор)
            let matchesTags = true;
            if (activeTags.size > 0) {
                // Превращаем Set активных тегов в массив
                const activeArray = Array.from(activeTags).map(t => t.toLowerCase());
                
                // ЛОГИКА: Показать, если у карточки есть ХОТЯ БЫ ОДИН из выбранных тегов
                matchesTags = activeArray.some(tag => cardTags.includes(tag));
                
                // Если нужна СТРОГАЯ логика (карточка должна иметь ВСЕ выбранные теги), раскомментируй строку ниже:
                // matchesTags = activeArray.every(tag => cardTags.includes(tag));
            }

            // Финальное решение
            if (matchesSearch && matchesTags) {
                card.style.display = 'block';
                // Небольшая задержка для плавности
                requestAnimationFrame(() => { card.style.opacity = '1'; card.style.transform = 'translateY(0)'; });
            } else {
                card.style.display = 'none';
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
            }
        });
    }

    // 5. ИНИЦИАЛИЗАЦИЯ ИНТЕРФЕЙСА
    function initInterface(pageType) {
        
        // --- A. ЭФФЕКТ ЗАГОЛОВКА ---
        const headerTitle = document.querySelector('.page-header h1');
        if (headerTitle) {
            const originalText = headerTitle.innerText;
            const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890///";
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

        // --- B. ПОИСК ---
        const searchInput = document.getElementById('searchInput');
        if(searchInput) {
            searchInput.addEventListener('input', updateList);
        }

        // --- C. УПРАВЛЕНИЕ СЕТКОЙ (4, 5, 6 колонок) ---
        const viewBtns = document.querySelectorAll('.view-btn');
        const grid = document.querySelector('.grid-cards');
        
        // Восстановление сохраненной настройки
        const savedCols = localStorage.getItem(STORAGE_KEY_COLS);
        if (savedCols && grid) {
            grid.className = `grid-cards cols-${savedCols}`;
            viewBtns.forEach(b => {
                b.classList.remove('active');
                if(b.dataset.cols === savedCols) b.classList.add('active');
            });
        }

        viewBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Визуальное переключение
                viewBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Применение класса
                const cols = btn.dataset.cols;
                if(grid) grid.className = `grid-cards cols-${cols}`;
                
                // Сохранение
                localStorage.setItem(STORAGE_KEY_COLS, cols);
            });
        });

        // Инициализация модалки
        const cardSelector = pageType ? `.${(pageType === 'games' ? 'game' : 'anime')}-card` : '.card';
        initModal(cardSelector);
    }

    // 6. МОДАЛЬНОЕ ОКНО
    function initModal(cardSelector) {
        const modal = document.getElementById('detailModal');
        const grid = document.querySelector('.grid-cards');
        const closeBtn = document.getElementById('closeModal');
        
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
            
            const rInfo = document.getElementById('modalRank');
            if(rInfo) {
                rInfo.textContent = d.rank;
                rInfo.style.color = (d.rank === 'UR') ? 'var(--gold)' : (d.rank === 'SSR' ? 'var(--cyan)' : 'rgba(255,255,255,0.05)');
            }

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

        if(closeBtn) closeBtn.onclick = () => modal.classList.remove('active');
        modal.onclick = (e) => { if(e.target === modal) modal.classList.remove('active'); };
        document.onkeydown = (e) => { if (e.key === 'Escape') modal.classList.remove('active'); };
    }
});
