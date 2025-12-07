document.addEventListener('DOMContentLoaded', () => {
    
    // --- 0. КОНФИГУРАЦИЯ И ПЕРЕМЕННЫЕ ---
    const pageType = document.body.getAttribute('data-page'); // 'games' или 'anime'
    const gridContainer = document.getElementById('cards-container');
    const STORAGE_KEY_COLS = 'resonance_grid_columns';
    
    // --- 1. ЗАГРУЗКА ДАННЫХ ИЗ JSON ---
    if (pageType && gridContainer) {
        fetch('data.json')
            .then(response => response.json())
            .then(data => {
                const items = data[pageType]; // Берем массив games или anime
                renderCards(items);
                initInterface(); // Запускаем логику интерфейса только после создания карточек
            })
            .catch(error => console.error('Ошибка загрузки базы данных:', error));
    } else {
        // Если мы на главной (index.html), просто запускаем анимации
        initInterface();
    }

    // --- 2. ГЕНЕРАЦИЯ HTML КАРТОЧЕК ---
    function renderCards(items) {
        if (!items) return;
        
        gridContainer.innerHTML = items.map((item, index) => {
            // Определяем цвет звезд/текста в зависимости от ранга
            const metaColor = (item.rank === 'UR') ? 'var(--gold)' : 
                              (item.rank === 'SSR') ? 'var(--cyan)' : 'var(--text-muted)';
            
            return `
            <div class="card" 
                 data-category="${item.category}" 
                 data-desc="${item.desc}"
                 data-tags="${item.tags}"
                 data-platform="${item.platform}"
                 data-dev="${item.dev}"
                 data-rank="${item.rank}"
                 style="opacity: 0; transform: translateY(20px);"> <!-- Скрыто для анимации -->
                
                <div class="card-img" style="background-image: url('${item.image}');"></div>
                <div class="rank-badge ${item.rank.toLowerCase()}">${item.rank}</div>
                <div class="card-content">
                    <div class="card-title">${item.title}</div>
                    <div class="card-meta">
                        <span class="meta-highlight" style="color: ${metaColor}">${item.meta_highlight}</span>
                        <span>${item.meta_sub}</span>
                    </div>
                </div>
            </div>
            `;
        }).join('');
    }

    // --- 3. ИНИЦИАЛИЗАЦИЯ ИНТЕРФЕЙСА (ПОСЛЕ ЗАГРУЗКИ) ---
    function initInterface() {
        
        // A. АНИМАЦИЯ ПОЯВЛЕНИЯ
        const cards = document.querySelectorAll('.card, .hub-card');
        cards.forEach((card, index) => {
            card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100 + 50);
        });

        // B. ЭФФЕКТ ДЕКОДИРОВАНИЯ ЗАГОЛОВКА
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

        // C. ЛОГИКА СЕТКИ (COLUMNS MEMORY)
        const viewBtns = document.querySelectorAll('.view-btn');
        const grid = document.querySelector('.grid-cards'); // или cards-container

        function applyGridColumns(cols) {
            if (!grid) return;
            grid.className = 'grid-cards'; // Сброс
            grid.classList.add(`cols-${cols}`);
            
            viewBtns.forEach(b => {
                b.classList.remove('active');
                if (b.getAttribute('data-cols') === cols) b.classList.add('active');
            });
        }

        if (grid) {
            const savedCols = localStorage.getItem(STORAGE_KEY_COLS);
            if (savedCols) applyGridColumns(savedCols);
        }

        viewBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const cols = btn.getAttribute('data-cols');
                applyGridColumns(cols);
                localStorage.setItem(STORAGE_KEY_COLS, cols);
            });
        });

        // D. ФИЛЬТРАЦИЯ И ПОИСК
        const dropdown = document.querySelector('.custom-dropdown');
        const searchInput = document.getElementById('searchInput');
        const allItems = document.querySelectorAll('.card'); // Берем уже созданные карточки

        let currentCategory = 'all';
        let currentSearch = '';

        function updateList() {
            allItems.forEach(item => {
                const itemCategory = item.getAttribute('data-category');
                const itemTitle = item.querySelector('.card-title').textContent.toLowerCase();
                
                const matchCategory = (currentCategory === 'all' || currentCategory === itemCategory);
                const matchSearch = itemTitle.includes(currentSearch);

                if (matchCategory && matchSearch) {
                    item.style.display = 'block';
                    setTimeout(() => { item.style.opacity = '1'; item.style.transform = 'translateY(0)'; }, 50);
                } else {
                    item.style.display = 'none';
                }
            });
        }

        // Dropdown Events
        if (dropdown) {
            const trigger = dropdown.querySelector('.dropdown-trigger');
            const options = dropdown.querySelectorAll('.option');
            const selectedText = dropdown.querySelector('.selected-text');

            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.toggle('open');
            });

            options.forEach(option => {
                option.addEventListener('click', () => {
                    options.forEach(opt => opt.classList.remove('active'));
                    option.classList.add('active');
                    selectedText.textContent = option.textContent;
                    dropdown.classList.remove('open');
                    currentCategory = option.getAttribute('data-filter');
                    updateList();
                });
            });

            document.addEventListener('click', (e) => {
                if (!dropdown.contains(e.target)) dropdown.classList.remove('open');
            });
        }

        // Search Events
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                currentSearch = e.target.value.toLowerCase().trim();
                updateList();
            });
        }

        // E. MODAL LOGIC (HUD)
        initModal(); 
    }

    // --- 4. ЛОГИКА МОДАЛЬНОГО ОКНА ---
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
            // Данные берем из data-атрибутов, которые мы сгенерировали
            const bgImage = card.querySelector('.card-img').style.backgroundImage;
            const title = card.querySelector('.card-title').textContent;
            
            const desc = card.getAttribute('data-desc') || "No description.";
            const rawTags = card.getAttribute('data-tags') || "ARCHIVE";
            const platform = card.getAttribute('data-platform') || "Unknown";
            const developer = card.getAttribute('data-dev') || "Unknown";
            const rank = card.getAttribute('data-rank') || "N/A";

            modalImg.style.backgroundImage = bgImage;
            modalTitle.textContent = title;
            modalDesc.textContent = desc;
            
            if(modalPlatform) modalPlatform.textContent = platform;
            if(modalDev) modalDev.textContent = developer;

            if(modalRankTag) {
                modalRankTag.textContent = rank;
                if (rank === 'UR') modalRankTag.style.color = 'var(--gold)';
                else if (rank === 'SSR') modalRankTag.style.color = 'var(--cyan)';
                else modalRankTag.style.color = 'var(--text-muted)';
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
            document.body.style.overflow = 'hidden';
            document.body.style.paddingRight = '17px';
        }

        function closeModal() {
            modal.classList.remove('active');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        }

        // Используем делегирование событий, так как карточки создаются динамически
        if(grid) {
            // Удаляем старые слушатели (если есть) через cloneNode (хак) или просто вешаем новый
            // Но так как initInterface вызывается один раз, просто вешаем listener
            grid.addEventListener('click', (e) => {
                const card = e.target.closest('.card');
                if (card) openModal(card);
            });
        }

        closeBtn.onclick = closeModal;
        modal.onclick = (e) => { if (e.target === modal) closeModal(); };
        document.onkeydown = (e) => { if (e.key === 'Escape' && modal.classList.contains('active')) closeModal(); };
    }
});
