document.addEventListener('DOMContentLoaded', () => {

    /* --- 1. АНИМАЦИЯ ПОЯВЛЕНИЯ КАРТОЧЕК --- */
    const cards = document.querySelectorAll('.card, .hub-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100 + 100);
    });

    /* --- 2. ЭФФЕКТ ДЕКОДИРОВАНИЯ ТЕКСТА --- */
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

    /* --- 3. ФИЛЬТРАЦИЯ, ПОИСК И СОХРАНЕНИЕ СЕТКИ (ОБНОВЛЕНО) --- */
    const dropdown = document.querySelector('.custom-dropdown');
    const searchInput = document.getElementById('searchInput');
    const items = document.querySelectorAll('.card');
    const viewBtns = document.querySelectorAll('.view-btn');
    const gridContainer = document.querySelector('.grid-cards');

    // Ключ для LocalStorage
    const STORAGE_KEY_COLS = 'resonance_grid_columns';

    let currentCategory = 'all';
    let currentSearch = '';

    // === ЛОГИКА СЕТКИ И LOCAL STORAGE ===
    
    // Функция применения сетки (меняет класс контейнера и активную кнопку)
    function applyGridColumns(cols) {
        if (!gridContainer) return;

        // Сброс классов сетки и добавление нужного
        gridContainer.className = 'grid-cards'; 
        gridContainer.classList.add(`cols-${cols}`);

        // Обновление кнопок
        if (viewBtns.length > 0) {
            viewBtns.forEach(b => {
                b.classList.remove('active');
                if (b.getAttribute('data-cols') === cols) {
                    b.classList.add('active');
                }
            });
        }
    }

    // 1. При загрузке проверяем память
    if (gridContainer) {
        const savedCols = localStorage.getItem(STORAGE_KEY_COLS);
        if (savedCols) {
            applyGridColumns(savedCols);
        }
    }

    // 2. Обработчик клика по кнопкам
    if (viewBtns.length > 0 && gridContainer) {
        viewBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const cols = btn.getAttribute('data-cols');
                // Применяем визуально
                applyGridColumns(cols);
                // Сохраняем в память
                localStorage.setItem(STORAGE_KEY_COLS, cols);
            });
        });
    }

    // === КОНЕЦ ЛОГИКИ СЕТКИ ===

    function updateList() {
        items.forEach(item => {
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

    // Dropdown Logic
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

    // Search Logic
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearch = e.target.value.toLowerCase().trim();
            updateList();
        });
    }

    /* --- 4. HUD MODAL WINDOW LOGIC --- */
    const modal = document.getElementById('detailModal');
    const closeBtn = document.getElementById('closeModal');
    
    // Элементы модального окна
    const modalImg = document.getElementById('modalImg');
    const modalTitle = document.getElementById('modalTitle');
    const modalDesc = document.getElementById('modalDesc');
    const modalRankTag = document.getElementById('modalRank');
    const modalTags = document.getElementById('modalTags');
    const modalPlatform = document.getElementById('modalPlatform');
    const modalDev = document.getElementById('modalDev');

    if (modal) {
        function openModal(card) {
            const bgImage = card.querySelector('.card-img').style.backgroundImage;
            const title = card.querySelector('.card-title').textContent;
            
            const desc = card.getAttribute('data-desc') || "No description available.";
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
            // Компенсация скроллбара, чтобы экран не дергался
            document.body.style.paddingRight = '17px'; 
        }

        function closeModal() {
            modal.classList.remove('active');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        }

        const grid = document.querySelector('.grid-cards');
        if(grid) {
            grid.addEventListener('click', (e) => {
                const card = e.target.closest('.card');
                if (card) openModal(card);
            });
        }

        closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
        });
    }
});
