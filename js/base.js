let currentTheme = localStorage.getItem("grovi_theme") || "light"

document.addEventListener("DOMContentLoaded", () => {
  initializeTheme()
  setupNavigation()
  setupModals()
})

function initializeTheme() {
  document.documentElement.setAttribute("data-theme", currentTheme)
  updateThemeIcon()
}

function toggleTheme() {
  currentTheme = currentTheme === "light" ? "dark" : "light"
  document.documentElement.setAttribute("data-theme", currentTheme)
  localStorage.setItem("grovi_theme", currentTheme)
  updateThemeIcon()
  showNotification(`Switched to ${currentTheme} mode`, "info")
}

function updateThemeIcon() {
  const themeIcons = document.querySelectorAll(".theme-icon")
  themeIcons.forEach((icon) => {
    icon.textContent = currentTheme === "light" ? "🌙" : "☀️"
  })
}

function setupNavigation() {
  const themeToggle = document.getElementById("theme-toggle")
  if (themeToggle) {
    themeToggle.addEventListener("click", toggleTheme)
  }

  const hamburger = document.querySelector(".hamburger")
  const navMenu = document.querySelector(".nav-menu")

  if (hamburger && navMenu) {
    hamburger.addEventListener("click", () => {
      hamburger.classList.toggle("active")
      navMenu.classList.toggle("active")
    })

    document.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", () => {
        hamburger.classList.remove("active")
        navMenu.classList.remove("active")
      })
    })
  }

  updateActiveNavLink()
}

function updateActiveNavLink() {
  const currentPage = getCurrentPage()
  const navLinks = document.querySelectorAll(".nav-link")

  navLinks.forEach((link) => {
    const href = link.getAttribute("href")
    const linkPage = href.split(".")[0]

    if (
      (currentPage === "index" && href === "index.html") ||
      (currentPage !== "index" && href === `${currentPage}.html`)
    ) {
      link.classList.add("active")
    } else {
      link.classList.remove("active")
    }
  })
}

function getCurrentPage() {
  const path = window.location.pathname
  const page = path.split("/").pop().split(".")[0]
  return page || "index"
}

function setupModals() {
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal") || e.target.classList.contains("close")) {
      closeAllModals()
    }
  })

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeAllModals()
    }
  })
}

function closeAllModals() {
  const modals = document.querySelectorAll(".modal")
  modals.forEach((modal) => {
    modal.classList.remove("show")
  })
}

function showNotification(message, type = "info") {
  const notification = document.createElement("div")
  notification.className = `notification notification-${type}`
  notification.innerHTML = `
    <span>${message}</span>
    <button onclick="this.parentElement.remove()">&times;</button>
  `

  if (!document.querySelector("#notification-styles")) {
    const styles = document.createElement("style")
    styles.id = "notification-styles"
    styles.textContent = `
      .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 3000;
        display: flex;
        align-items: center;
        gap: 1rem;
        max-width: 400px;
        animation: slideIn 0.3s ease-out;
      }
      .notification-success { background: #d4edda; color: #155724; }
      .notification-error { background: #f8d7da; color: #721c24; }
      .notification-info { background: #d1ecf1; color: #0c5460; }
      .notification button {
        background: none;
        border: none;
        font-size: 1.2rem;
        cursor: pointer;
        opacity: 0.7;
      }
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `
    document.head.appendChild(styles)
  }

  document.body.appendChild(notification)
  setTimeout(() => notification.remove(), 5000)
}

function formatDate(date) {
  if (!date) return "Never"

  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString()
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function escapeHtml(text) {
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}

window.toggleTheme = toggleTheme
window.showNotification = showNotification
window.closeAllModals = closeAllModals