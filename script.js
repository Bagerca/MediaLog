document.addEventListener('DOMContentLoaded', () => {
    // 1. Анимация появления карточек при загрузке
    const cards = document.querySelectorAll('.hub-card, .anime-card, .game-module');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.animation = `fadeIn 0.5s ease forwards ${index * 0.1}s`;
    });

    // 2. Логика фильтров
    const filterBtns = document.querySelectorAll('.filter-btn');
    const items = document.querySelectorAll('.anime-card, .game-module');

    if (filterBtns.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Убираем активный класс у всех кнопок
                filterBtns.forEach(b => b.classList.remove('active'));
                // Добавляем нажатой
                btn.classList.add('active');

                const filterValue = btn.getAttribute('data-filter');

                items.forEach(item => {
                    const category = item.getAttribute('data-category');
                    
                    if (filterValue === 'all' || filterValue === category) {
                        item.style.display = 'block'; // Показываем
                        // Сброс анимации для красоты
                        item.style.animation = 'none';
                        item.offsetHeight; /* trigger reflow */
                        item.style.animation = 'fadeIn 0.5s ease forwards';
                    } else {
                        item.style.display = 'none'; // Скрываем
                    }
                });
            });
        });
    }
});
