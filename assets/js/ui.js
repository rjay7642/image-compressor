document.addEventListener("DOMContentLoaded", function () {
  const toggleBtn = document.querySelector(".nav-toggle");
  const navMenu = document.querySelector(".nav-links");
  const dropdownToggle = document.querySelector(".nav-dropdown-toggle");
  const navLinks = document.querySelectorAll(".nav-links a");

  if (!toggleBtn || !navMenu) {
    console.log("Navbar elements not found");
    return;
  }

  toggleBtn.addEventListener("click", function () {
    navMenu.classList.toggle("active");
  });

  if (dropdownToggle) {
    dropdownToggle.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      const parent = dropdownToggle.closest(".dropdown");
      if (parent) {
        parent.classList.toggle("open");
      }
    });
  }

  document.addEventListener("click", function () {
    const parent = dropdownToggle ? dropdownToggle.closest(".dropdown") : null;
    if (parent) {
      parent.classList.remove("open");
    }
  });

  const dropdownMenu = document.querySelector(".nav-dropdown");
  if (dropdownMenu) {
    dropdownMenu.addEventListener("click", function (event) {
      event.stopPropagation();
    });
  }

  const currentPage = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
  let dropdownActive = false;

  navLinks.forEach(link => {
    const href = (link.getAttribute("href") || "").toLowerCase();
    if (href === currentPage) {
      link.classList.add("active");
      if (link.closest(".nav-dropdown")) {
        dropdownActive = true;
      }
    }
  });

  if (dropdownToggle && dropdownActive) {
    dropdownToggle.classList.add("active");
  }
});

