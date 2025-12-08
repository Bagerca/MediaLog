document.addEventListener('DOMContentLoaded', () => {
    
    // --- 0. КОНФИГУРАЦИЯ ---
    const pageType = document.body.getAttribute('data-page'); 
    const gridContainer = document.getElementById('cards-container');
    const STORAGE_KEY_COLS = 'resonance_grid_columns';
    
    // --- 1. ЗАГРУЗКА ДАННЫХ ИЗ JSON ---
    if (pageType && gridContainer) {
        fetch('data.json')
            .then(response => response.json())
            .then(data => {
                const items = data[pageType]; // Берём массив 'games' или 'anime'
                
                if (pageType === 'games') {
                    renderGameCards(items);
                } else if (pageType === 'anime') {
                    renderAnimeCards(items);
                } else {
                    renderGenericCards(items); // Запасной вариант
                }

                generateFilters(items); 
                initInterface(); 
            })
            .catch(error => console.error('Ошибка загрузки базы данных:', error));
    } else {
        // Если мы на главной (index.html), просто запускаем интерфейсные эффекты
        initInterface();
    }

    // --- 2.1 ГЕНЕРАЦИЯ КАРТОЧЕК ДЛЯ ИГР (Стиль HUD) ---
    function renderGameCards(items) {
        if (!items) return;
        
        gridContainer.innerHTML = items.map((item, index) => {
            // Логика прогресс бара (симуляция)
            let progressWidth = "100%";
            let isInfinite = false;
            
            if (item.meta_sub.toLowerCase().includes('active') || item.meta_sub.toLowerCase().includes('daily')) {
                isInfinite = true; // Бесконечная анимация для активных игр
            } else if (item.meta_sub.toLowerCase().includes('archived')) {
                progressWidth = "100%"; // Полный бар для пройденных
            } else {
                progressWidth = "40%"; // Примерный прогресс для остальных
            }

            // Данные для модального окна храним в data-атрибутах контейнера
            return `
            <div class="game-module card-item" 
                 data-title="${item.title}"
                 data-desc="${item.desc}"
                 data-tags="${item.tags}"
                 data-platform="${item.platform}"
                 data-dev="${item.dev}"
                 data-rank="${item.rank}"
                 data-image="${item.image}"
                 data-status="${item.meta_sub}"
                 style="opacity: 0; transform: translateY(20px);"> 
                
                <div class="module-bg" style="background-image: url('${item.image}');"></div>
                
                <div class="module-content">
                    <div class="module-top">
                        <span class="platform">${item.platform}</span>
                        <span class="rank ${item.rank.toLowerCase()}">${item.rank}</span>
                    </div>

                    <div class="module-main">
                        <h2>${item.title}</h2>
                        <div class="playtime">${item.meta_highlight}</div>
                    </div>

                    <div class="module-footer">
                        <span class="status">${item.meta_sub}</span>
                        <div class="progress-bar">
                            <div class="progress ${isInfinite ? 'infinite' : ''}" style="width: ${progressWidth};"></div>
                        </div>
                    </div>
                </div>

                <!-- Декоративные углы -->
                <div class="corner t-l"></div><div class="corner t-r"></div>
                <div class="corner b-l"></div><div class="corner b-r"></div>
            </div>
            `;
        }).join('');
    }

    // --- 2.2 ГЕНЕРАЦИЯ КАРТОЧЕК ДЛЯ АНИМЕ (Стиль Poster) ---
    function renderAnimeCards(items) {
        if (!items) return;

        gridContainer.innerHTML = items.map((item, index) => {
            // Проверка статуса для цветной полоски
            const isCompleted = item.meta_sub.toLowerCase().includes('completed') || item.meta_sub.toLowerCase().includes('masterpiece');
            
            return `
            <div class="anime-card card-item"
                 data-title="${item.title}"
                 data-desc="${item.desc}"
                 data-tags="${item.tags}"
                 data-platform="${item.platform}"
                 data-dev="${item.dev}"
                 data-rank="${item.rank}"
                 data-image="${item.image}"
                 data-status="${item.meta_sub}"
                 style="opacity: 0; transform: translateY(20px);">
                
                <div class="poster-wrapper">
                    <img src="${item.image}" alt="${item.title}" loading="lazy">
                    <div class="rating-badge ${item.rank.toLowerCase()}">${item.rank}</div>
                    <div class="poster-overlay">
                        <span class="view-btn">ACCESS LOG</span>
                    </div>
                </div>

                <div class="anime-info">
                    <h3>${item.title}</h3>
                    <div class="meta-row">
                        <span>${item.meta_highlight}</span>
                        <span class="type-tag">${item.platform}</span>
                    </div>
                    <div class="status-bar ${isCompleted ? 'completed' : ''}">
                        <span>${item.meta_sub}</span>
                        <div class="bar-fill"></div>
                    </div>
                </div>
            </div>
            `;
        }).join('');
    }

    // --- 2.3 ЗАПАСНОЙ РЕНДЕР (Если не указан тип) ---
    function renderGenericCards(items) {
        // Использует базовый стиль .card из style.css
        gridContainer.innerHTML = items.map(item => `
            <div class="card card-item" 
                 data-title="${item.title}" data-image="${item.image}" data-desc="${item.desc}" 
                 data-rank="${item.rank}" data-tags="${item.tags}">
                <div class="card-inner">
                    <div class="card-img" style="background-image: url('${item.image}');"></div>
                    <div class="rank-badge ${item.rank.toLowerCase()}">${item.rank}</div>
                    <div class="card-content">
                        <div class="card-title">${item.title}</div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // --- 3. ГЕНЕРАЦИЯ ФИЛЬТРОВ ---
    function generateFilters(items) {
        const filterContainer = document.getElementById('filterOptions');
        if (!filterContainer) return;

        const allTags = new Set();
        items.forEach(item => {
            if (item.tags) item.tags.split(',').forEach(tag => allTags.add(tag.trim()));
        });

        const sortedTags = Array.from(allTags).sort();
        let html = `<div class="option active" data-filter="all">ALL RECORDS</div>`;
        sortedTags.forEach(tag => {
            html += `<div class="option" data-filter="${tag}">${tag}</div>`;
        });

        filterContainer.innerHTML = html;
    }

    // --- 4. ИНИЦИАЛИЗАЦИЯ ИНТЕРФЕЙСА ---
    function initInterface() {
        
        // A. ПОЯВЛЕНИЕ КАРТОЧЕК (Stagger Animation)
        const cards = document.querySelectorAll('.card-item, .hub-card, .movie-card, .sim-card');
        cards.forEach((card, index) => {
            // Небольшая задержка для каждой карточки
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 80 + 50);
        });

        // B. ЭФФЕКТ ДЕКОДИРОВАНИЯ ТЕКСТА (Заголовки)
        const headerTitle = document.querySelector('.page-header h1');
        if (headerTitle) {
            const originalText = headerTitle.innerText;
            const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890@#$%^&*";
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

        // C. ЛОГИКА СЕТКИ (GRID COLUMNS)
        const viewBtns = document.querySelectorAll('.view-btn');
        const grid = document.querySelector('.grid-cards');

        function applyGridColumns(cols) {
            if (!grid) return;
            
            // Защита: если в памяти осталось '3', меняем на '4'
            if (cols === '3' || !cols) cols = '4';

            grid.className = 'grid-cards'; // Сброс
            grid.classList.add(`cols-${cols}`);
            
            // Подсветка активной кнопки
            viewBtns.forEach(b => {
                b.classList.remove('active');
                if (b.getAttribute('data-cols') === cols) b.classList.add('active');
            });
        }

        if (grid) {
            const savedCols = localStorage.getItem(STORAGE_KEY_COLS);
            applyGridColumns(savedCols || '4');
        }

        viewBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const cols = btn.getAttribute('data-cols');
                // Убедимся, что это кнопка управления сеткой, а не что-то другое
                if(cols) {
                    applyGridColumns(cols);
                    localStorage.setItem(STORAGE_KEY_COLS, cols);
                }
            });
        });

        // D. ФИЛЬТРАЦИЯ И ПОИСК
        const dropdown = document.querySelector('.custom-dropdown');
        const searchInput = document.getElementById('searchInput');
        let currentFilterTag = 'all';
        let currentSearch = '';

        function updateList() {
            const allItems = document.querySelectorAll('.card-item'); // Используем общий класс card-item
            allItems.forEach(item => {
                const itemTags = item.getAttribute('data-tags') || "";
                const itemTitle = item.getAttribute('data-title').toLowerCase();
                
                const matchTag = (currentFilterTag === 'all' || itemTags.includes(currentFilterTag));
                const matchSearch = itemTitle.includes(currentSearch);

                if (matchTag && matchSearch) {
                    item.style.display = 'block';
                    // Перезапуск анимации появления
                    setTimeout(() => { item.style.opacity = '1'; item.style.transform = 'translateY(0)'; }, 50);
                } else {
                    item.style.display = 'none';
                    item.style.opacity = '0';
                    item.style.transform = 'translateY(20px)';
                }
            });
        }

        if (dropdown) {
            const trigger = dropdown.querySelector('.dropdown-trigger');
            const optionsContainer = dropdown.querySelector('.dropdown-options');
            const selectedText = dropdown.querySelector('.selected-text');

            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.toggle('open');
            });

            if (optionsContainer) {
                optionsContainer.addEventListener('click', (e) => {
                    const option = e.target.closest('.option');
                    if (!option) return;
                    optionsContainer.querySelectorAll('.option').forEach(opt => opt.classList.remove('active'));
                    option.classList.add('active');
                    
                    const filterValue = option.getAttribute('data-filter');
                    selectedText.textContent = (filterValue === 'all') ? 'FILTER BY TAGS' : option.textContent;
                    
                    dropdown.classList.remove('open');
                    currentFilterTag = filterValue;
                    updateList();
                });
            }
            document.addEventListener('click', (e) => {
                if (!dropdown.contains(e.target)) dropdown.classList.remove('open');
            });
        }

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                currentSearch = e.target.value.toLowerCase().trim();
                updateList();
            });
        }

        initModal(); 
    }

    // --- 5. ЛОГИКА МОДАЛЬНОГО ОКНА ---
    function initModal() {
        const modal = document.getElementById('detailModal');
        const closeBtn = document.getElementById('closeModal');
        const grid = document.querySelector('.grid-cards');

        if (!modal) return;

        const modalImg = document.getElementById('modalImg');
        const modalTitle = document.getElementById('modalTitle');
        const modalDesc = document.getElementById('modalDesc');
        const modalRankTag = document.getElementById('modalRank');
        const modalTags = document.getElementById('modalTags');
        const modalPlatform = document.getElementById('modalPlatform');
        const modalDev = document.getElementById('modalDev');

        function openModal(card) {
            // Получаем данные из dataset (работает для всех типов карточек)
            const title = card.getAttribute('data-title');
            const desc = card.getAttribute('data-desc') || "No description.";
            const rawTags = card.getAttribute('data-tags') || "ARCHIVE";
            const platform = card.getAttribute('data-platform') || "Unknown";
            const developer = card.getAttribute('data-dev') || "Unknown";
            const rank = card.getAttribute('data-rank') || "N/A";
            const imgUrl = card.getAttribute('data-image');

            modalImg.src = imgUrl; 
            modalTitle.textContent = title;
            modalDesc.textContent = desc;
            
            if(modalPlatform) modalPlatform.textContent = platform;
            if(modalDev) modalDev.textContent = developer;

            if(modalRankTag) {
                modalRankTag.textContent = rank;
                if (rank === 'UR') modalRankTag.style.color = 'var(--gold)';
                else if (rank === 'SSR') modalRankTag.style.color = 'var(--cyan)';
                else modalRankTag.style.color = 'rgba(255,255,255,0.05)';
            }

            if(modalTags) {
                modalTags.innerHTML = '';
                const tagsArray = rawTags.split(',');
                tagsArray.forEach(tag => {
                    const span = document.createElement('span');
                    span.className = 'tech-tag';
                    span.textContent = tag.trim();
                    modalTags.appendChild(span);
                });
            }

            modal.classList.add('active');
            document.body.style.overflow = 'hidden'; // Блокировка скролла
        }

        function closeModal() {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }

        if(grid) {
            grid.addEventListener('click', (e) => {
                // Ищем ближайший родительский элемент с классом card-item
                const card = e.target.closest('.card-item');
                if (card) openModal(card);
            });
        }

        if(closeBtn) closeBtn.onclick = closeModal;
        modal.onclick = (e) => { if (e.target === modal) closeModal(); };
        document.onkeydown = (e) => { if (e.key === 'Escape' && modal.classList.contains('active')) closeModal(); };
    }
});
