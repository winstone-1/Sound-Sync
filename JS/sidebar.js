function toggleSidebar() {
  const sidebar = document.querySelector('aside');
  const main    = document.querySelector('.ml-64');
  const overlay = document.getElementById('sidebar-overlay');

  sidebar.classList.toggle('-translate-x-full');
  main.classList.toggle('ml-0');
  main.classList.toggle('ml-64');
   overlay.classList.toggle('hidden');
}
// 6. SIDEBAR MENU TOGGLE LOGIC
const menuButtons = document.querySelectorAll('.menu-btn');
const mobileMenus = document.querySelectorAll('.mobile-menu');

menuButtons.forEach((btn, index) => {
    btn.addEventListener('click', () => {
        mobileMenus[index].classList.toggle('hidden');
    });
});