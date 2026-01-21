document.addEventListener("DOMContentLoaded", function () {
  const toggleBtn = document.querySelector(".nav-toggle");
  const navMenu = document.querySelector(".nav-links");

  if (!toggleBtn || !navMenu) {
    console.log("Navbar elements not found");
    return;
  }

  toggleBtn.addEventListener("click", function () {
    navMenu.classList.toggle("active");
  });
});
