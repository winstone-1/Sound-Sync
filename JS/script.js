// DOM ELEMENTS
const menuButtons = document.querySelectorAll('.menu-btn');
    const mobileMenus = document.querySelectorAll('.mobile-menu');


    
    menuButtons.forEach((btn, index) => {
        btn.addEventListener('click', () => {
            mobileMenus[index].classList.toggle('hidden');
        });
    });