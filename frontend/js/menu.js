// Мобильное меню
document.addEventListener('DOMContentLoaded', function() {
    const hamburgerBtn = document.getElementById('hamburger-menu');
    const mobileNav = document.getElementById('mobile-nav');
    
    if (hamburgerBtn && mobileNav) {
        // Открытие/закрытие меню при клике на hamburger
        hamburgerBtn.addEventListener('click', function() {
            hamburgerBtn.classList.toggle('active');
            mobileNav.classList.toggle('active');
        });
        
        // Закрытие меню при клике на ссылку
        const navLinks = mobileNav.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                hamburgerBtn.classList.remove('active');
                mobileNav.classList.remove('active');
            });
        });
        
        // Закрытие меню при клике вне его
        document.addEventListener('click', function(e) {
            if (!hamburgerBtn.contains(e.target) && !mobileNav.contains(e.target)) {
                hamburgerBtn.classList.remove('active');
                mobileNav.classList.remove('active');
            }
        });
    }
});
