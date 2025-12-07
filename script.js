document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Анимация появления карточек ---
    const cards = document.querySelectorAll('.card, .hub-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100 + 300);
    });

    // --- 2. Декодер заголовка ---
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
            iteration += 1 / 3;
        }, 30);
    }

    // --- 3. ФИЛЬТР + ПОИСК (ЕДИНАЯ СИСТЕМА) ---
    const dropdown = document.querySelector('.custom-dropdown');
    const searchInput = document.getElementById('searchInput');
    const items = document.querySelectorAll('.card');

    let currentCategory = 'all';
    let currentSearch = '';

    function updateList() {
        items.forEach(item => {
            const itemCategory = item.getAttribute('data-category');
            const itemTitle = item.querySelector('.card-title').textContent.toLowerCase();
            const matchCategory = (currentCategory === 'all' || currentCategory === itemCategory);
            const matchSearch = itemTitle.includes(currentSearch);

            if (matchCategory && matchSearch) {
                item.style.display = 'block';
                if (item.style.opacity !== '1') {
                    item.style.opacity = '0';
                    item.style.transform = 'translateY(10px)';
                    setTimeout(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'translateY(0)';
                    }, 50);
                }
            } else {
                item.style.display = 'none';
            }
        });
    }

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

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearch = e.target.value.toLowerCase().trim();
            updateList();
        });
    }
});
