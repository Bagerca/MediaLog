document.addEventListener('DOMContentLoaded', () => {

    // 1. Анимация появления карточек
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

    // 2. Декодер заголовка
    const headerTitle = document.querySelector('.page-header h1');
    if (headerTitle) {
        const originalText = headerTitle.innerText;
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890@#$%^&*";
        let iteration = 0;
        let interval = null;
        clearInterval(interval);
        interval = setInterval(() => {
            headerTitle.innerText = originalText.split("").map((letter, index) => {
                if (index < iteration) return originalText[index];
                return chars[Math.floor(Math.random() * chars.length)];
            }).join("");
            if (iteration >= originalText.length) clearInterval(interval);
            iteration += 1 / 3;
        }, 30);
    }

    // 3. Dropdown Filter Logic
    const dropdown = document.querySelector('.custom-dropdown');
    
    if (dropdown) {
        const trigger = dropdown.querySelector('.dropdown-trigger');
        const options = dropdown.querySelectorAll('.option');
        const selectedText = dropdown.querySelector('.selected-text');
        const items = document.querySelectorAll('.card');

        // Toggle
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('open');
        });

        // Click Option
        options.forEach(option => {
            option.addEventListener('click', () => {
                // UI Update
                options.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                selectedText.textContent = option.textContent;
                dropdown.classList.remove('open');

                // Filter Logic
                const filterValue = option.getAttribute('data-filter');
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

        // Close outside
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove('open');
            }
        });
    }
});
