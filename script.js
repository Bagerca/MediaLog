document.addEventListener('DOMContentLoaded', () => {
    // Находим все карточки
    const cards = document.querySelectorAll('.card');
    
    // Делаем появление лесенкой (stagger effect)
    cards.forEach((card, index) => {
        card.style.opacity = '0'; // Скрываем изначально
        card.style.animation = `fadeInUp 0.6s ease-out forwards ${index * 0.1}s`;
    });

    // Звуковой эффект при наведении (опционально, визуальный эффект через консоль)
    const links = document.querySelectorAll('a, .card');
    links.forEach(link => {
        link.addEventListener('mouseenter', () => {
            console.log("HOVER // AUDIO RESONANCE");
            // Тут можно добавить реальный звук, если захочешь позже
        });
    });
});
