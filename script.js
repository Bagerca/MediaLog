document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Эффект Декодера для Заголовка ---
    const headerTitle = document.querySelector('.page-header h1');
    
    if (headerTitle) {
        // Сохраняем оригинальный текст (например, "VISUAL LOGS")
        const originalText = headerTitle.innerText;
        // Набор символов для "шифрования"
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890@#$%^&*";
        
        let iteration = 0;
        let interval = null;
        
        // Запускаем анимацию
        clearInterval(interval);
        
        interval = setInterval(() => {
            headerTitle.innerText = originalText
                .split("")
                .map((letter, index) => {
                    // Если буква уже "отгадана", оставляем её
                    if (index < iteration) {
                        return originalText[index];
                    }
                    // Иначе показываем случайный символ
                    return chars[Math.floor(Math.random() * chars.length)];
                })
                .join("");
            
            // Скорость открытия букв (чем меньше +=, тем медленнее)
            if (iteration >= originalText.length) { 
                clearInterval(interval);
            }
            
            iteration += 1 / 3; // Скорость перебора (1/3 буквы за кадр)
        }, 30); // Частота обновления (30мс)
    }

    // --- 2. Анимация появления карточек (оставляем твою старую) ---
    const cards = document.querySelectorAll('.card, .hub-card, .game-module, .anime-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100 + 300); // +300мс задержка, чтобы сначала сыграл заголовок
    });

    // --- 3. Логика кнопок фильтров (оставляем) ---
    const filterBtns = document.querySelectorAll('.wuwa-btn, .filter-btn');
    const items = document.querySelectorAll('.card, .anime-card, .game-module');

    if (filterBtns.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const filterValue = btn.getAttribute('data-filter');
                items.forEach(item => {
                    const category = item.getAttribute('data-category');
                    if (filterValue === 'all' || filterValue === category) {
                        item.style.display = 'block';
                        item.style.opacity = '0';
                        item.style.transform = 'translateY(10px)';
                        setTimeout(() => {
                            item.style.opacity = '1';
                            item.style.transform = 'translateY(0)';
                        }, 50);
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
        });
    }
});
