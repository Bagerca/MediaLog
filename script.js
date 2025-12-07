document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Эффект Декодера для Заголовка ---
    const headerTitle = document.querySelector('.page-header h1');
    
    if (headerTitle) {
        // Сохраняем оригинальный текст
        const originalText = headerTitle.innerText;
        // Набор символов для эффекта
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890@#$%^&*";
        
        let iteration = 0;
        let interval = null;
        
        clearInterval(interval);
        
        interval = setInterval(() => {
            headerTitle.innerText = originalText
                .split("")
                .map((letter, index) => {
                    if (index < iteration) {
                        return originalText[index];
                    }
                    return chars[Math.floor(Math.random() * chars.length)];
                })
                .join("");
            
            if (iteration >= originalText.length) { 
                clearInterval(interval);
            }
            
            iteration += 1 / 3; // Скорость расшифровки
        }, 30);
    }

    // --- 2. Анимация появления карточек ---
    const cards = document.querySelectorAll('.card, .hub-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        
        // Задержка +300мс, чтобы сначала появился заголовок
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100 + 300); 
    });

    // --- 3. Логика кнопок фильтров ---
    const filterBtns = document.querySelectorAll('.wuwa-btn');
    const items = document.querySelectorAll('.card');

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
                        // Сброс анимации для плавного показа
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
