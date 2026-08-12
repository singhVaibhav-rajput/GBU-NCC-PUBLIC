const menuBtn = document.getElementById("menu-btn");
const mobileMenu = document.getElementById("mobile-menu");

menuBtn.addEventListener("click", () => {

    mobileMenu.classList.toggle("hidden");

    const isOpen = !mobileMenu.classList.contains("hidden");

    menuBtn.setAttribute("aria-expanded", isOpen);

    menuBtn.textContent = isOpen ? "✕" : "☰";

});