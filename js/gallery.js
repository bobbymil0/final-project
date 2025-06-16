let plants = []

const plantEmojis = {
  succulent: "🌵",
  tropical: "🌿",
  flowering: "🌸",
  herb: "🌱",
  fern: "🍃",
  cactus: "🌵",
  vine: "🍀",
  other: "🪴",
}

document.addEventListener("DOMContentLoaded", () => {
  loadPlantsFromStorage()
  setupEventListeners()
  renderGallery()
  updateGalleryStats()
})

function loadPlantsFromStorage() {
  try {
    const storedPlants = localStorage.getItem("grovi_plants")
    if (storedPlants) {
      plants = JSON.parse(storedPlants)
      plants.forEach((plant) => {
        if (plant.lastWatered) {
          plant.lastWatered = new Date(plant.lastWatered)
        }
        if (plant.dateAdded) {
          plant.dateAdded = new Date(plant.dateAdded)
        }
      })
    }
  } catch (error) {
    console.error("Error loading plants:", error)
    plants = []
  }
}

function setupEventListeners() {
  const gallerySearch = document.getElementById("gallery-search")
  const typeFilter = document.getElementById("type-filter")
  const sortBy = document.getElementById("sort-by")

  if (gallerySearch) {
    gallerySearch.addEventListener("input", filterAndSortGallery)
  }

  if (typeFilter) {
    typeFilter.addEventListener("change", filterAndSortGallery)
  }

  if (sortBy) {
    sortBy.addEventListener("change", filterAndSortGallery)
  }
}

function filterAndSortGallery() {
  const gallerySearch = document.getElementById("gallery-search")
  const typeFilter = document.getElementById("type-filter")
  const sortBy = document.getElementById("sort-by")

  let filteredPlants = [...plants]

  // Filter by search term
  if (gallerySearch && gallerySearch.value.trim()) {
    const searchTerm = gallerySearch.value.trim().toLowerCase()
    filteredPlants = filteredPlants.filter(
      (plant) =>
        plant.name.toLowerCase().includes(searchTerm) ||
        plant.type.toLowerCase().includes(searchTerm) ||
        (plant.location && plant.location.toLowerCase().includes(searchTerm)),
    )
  }

  // Filter by type
  if (typeFilter && typeFilter.value !== "all") {
    filteredPlants = filteredPlants.filter((plant) => plant.type === typeFilter.value)
  }

  // Sort plants
  if (sortBy) {
    const sortValue = sortBy.value
    filteredPlants.sort((a, b) => {
      switch (sortValue) {
        case "name":
          return a.name.localeCompare(b.name)
        case "type":
          return a.type.localeCompare(b.type)
        case "lastWatered":
          if (!a.lastWatered && !b.lastWatered) return 0
          if (!a.lastWatered) return 1
          if (!b.lastWatered) return -1
          return b.lastWatered - a.lastWatered
        case "nextWatering":
          const aNext = getNextWateringDate(a)
          const bNext = getNextWateringDate(b)
          if (aNext === "ASAP" && bNext === "ASAP") return 0
          if (aNext === "ASAP") return -1
          if (bNext === "ASAP") return 1
          return new Date(aNext) - new Date(bNext)
        case "dateAdded":
          return (b.dateAdded || new Date(0)) - (a.dateAdded || new Date(0))
        default:
          return 0
      }
    })
  }

  renderGallery(filteredPlants)
}

function renderGallery(plantsToRender = plants) {
  const galleryContainer = document.getElementById("gallery-container")
  const galleryEmpty = document.getElementById("gallery-empty")

  if (!galleryContainer) return

  if (plantsToRender.length === 0) {
    galleryContainer.style.display = "none"
    if (galleryEmpty) galleryEmpty.style.display = "block"
    return
  }

  galleryContainer.style.display = "grid"
  if (galleryEmpty) galleryEmpty.style.display = "none"

  galleryContainer.innerHTML = plantsToRender.map((plant) => createPlantCard(plant)).join("")

  // Add event listeners to plant cards
  galleryContainer.querySelectorAll(".plant-card").forEach((card) => {
    const plantId = card.dataset.plantId

    const waterBtn = card.querySelector(".btn-water")
    if (waterBtn) {
      waterBtn.addEventListener("click", (e) => {
        e.stopPropagation()
        waterPlant(plantId)
      })
    }

    const editBtn = card.querySelector(".btn-edit")
    if (editBtn) {
      editBtn.addEventListener("click", (e) => {
        e.stopPropagation()
        editPlant(plantId)
      })
    }

    const deleteBtn = card.querySelector(".btn-delete")
    if (deleteBtn) {
      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation()
        deletePlant(plantId)
      })
    }
  })
}

function createPlantCard(plant) {
  const wateringStatus = getWateringStatus(plant)
  const nextWateringDate = getNextWateringDate(plant)

  return `
    <div class="plant-card" data-plant-id="${plant.id}">
      <div class="plant-header">
        <div class="plant-info">
          <h3>${escapeHtml(plant.name)} ${plantEmojis[plant.type] || "🪴"}</h3>
          <span class="plant-type">${capitalizeFirst(plant.type)}</span>
        </div>
        <div class="plant-actions">
          <button class="btn-icon btn-water" title="Water Plant">💧</button>
          <button class="btn-icon btn-edit" title="Edit Plant">✏️</button>
          <button class="btn-icon btn-delete" title="Delete Plant">🗑️</button>
        </div>
      </div>
      
      <div class="plant-details">
        <div class="detail-row">
          <span class="detail-label">Watering Frequency:</span>
          <span class="detail-value">Every ${plant.wateringFrequency} days</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Last Watered:</span>
          <span class="detail-value">${plant.lastWatered ? formatDate(plant.lastWatered) : "Never"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Next Watering:</span>
          <span class="detail-value">${nextWateringDate}</span>
        </div>
        ${
          plant.location
            ? `
        <div class="detail-row">
          <span class="detail-label">Location:</span>
          <span class="detail-value">${escapeHtml(plant.location)}</span>
        </div>
        `
            : ""
        }
      </div>
      
      <div class="water-status ${wateringStatus.class}">
        ${wateringStatus.text}
      </div>
      
      ${
        plant.notes
          ? `
      <div class="plant-notes">
        <strong>Notes:</strong> ${escapeHtml(plant.notes)}
      </div>
      `
          : ""
      }
    </div>
  `
}

function getWateringStatus(plant) {
  if (!plant.lastWatered) {
    return { class: "status-overdue", text: "Never watered" }
  }

  const daysSince = getDaysSinceWatered(plant)
  const frequency = plant.wateringFrequency

  if (daysSince >= frequency + 2) {
    return { class: "status-overdue", text: `Overdue by ${daysSince - frequency} days` }
  } else if (daysSince >= frequency) {
    return { class: "status-due", text: "Needs watering" }
  } else {
    return { class: "status-good", text: `Water in ${frequency - daysSince} days` }
  }
}

function getDaysSinceWatered(plant) {
  if (!plant.lastWatered) return Number.POSITIVE_INFINITY
  const now = new Date()
  const lastWatered = new Date(plant.lastWatered)
  const diffTime = Math.abs(now - lastWatered)
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}

function getNextWateringDate(plant) {
  if (!plant.lastWatered) return "ASAP"

  const nextDate = new Date(plant.lastWatered)
  nextDate.setDate(nextDate.getDate() + plant.wateringFrequency)

  const today = new Date()
  if (nextDate <= today) {
    return "Today"
  }

  return formatDate(nextDate)
}

function updateGalleryStats() {
  const galleryTotal = document.getElementById("gallery-total")
  const galleryWatered = document.getElementById("gallery-watered")
  const galleryOverdue = document.getElementById("gallery-overdue")
  const galleryHealthy = document.getElementById("gallery-healthy")

  if (galleryTotal) {
    galleryTotal.textContent = plants.length
  }

  if (galleryWatered) {
    const wateredToday = plants.filter((plant) => {
      if (!plant.lastWatered) return false
      const today = new Date()
      const lastWatered = new Date(plant.lastWatered)
      return (
        today.getDate() === lastWatered.getDate() &&
        today.getMonth() === lastWatered.getMonth() &&
        today.getFullYear() === lastWatered.getFullYear()
      )
    }).length
    galleryWatered.textContent = wateredToday
  }

  if (galleryOverdue) {
    const overdue = plants.filter((plant) => {
      const status = getWateringStatus(plant)
      return status.class === "status-overdue" || status.class === "status-due"
    }).length
    galleryOverdue.textContent = overdue
  }

  if (galleryHealthy) {
    const healthy = plants.filter((plant) => {
      const status = getWateringStatus(plant)
      return status.class === "status-good"
    }).length
    galleryHealthy.textContent = healthy
  }
}

function waterPlant(plantId) {
  const plant = plants.find((p) => p.id === plantId)
  if (!plant) return

  plant.lastWatered = new Date()
  savePlantsToStorage()
  renderGallery()
  updateGalleryStats()

  showNotification(`${plant.name} has been watered! 💧`, "success")
}

function editPlant(plantId) {
  window.location.href = `tracker.html?edit=${plantId}`
}

function deletePlant(plantId) {
  const plant = plants.find((p) => p.id === plantId)
  if (!plant) return

  if (confirm(`Are you sure you want to delete ${plant.name}?`)) {
    plants = plants.filter((p) => p.id !== plantId)
    savePlantsToStorage()
    renderGallery()
    updateGalleryStats()
    showNotification(`${plant.name} has been removed.`, "info")
  }
}

function savePlantsToStorage() {
  try {
    localStorage.setItem("grovi_plants", JSON.stringify(plants))
  } catch (error) {
    console.error("Error saving plants:", error)
    showNotification("Error saving data", "error")
  }
}

function clearSearch() {
  const gallerySearch = document.getElementById("gallery-search")
  if (gallerySearch) {
    gallerySearch.value = ""
    filterAndSortGallery()
  }
}

window.waterPlant = waterPlant
window.editPlant = editPlant
window.clearSearch = clearSearch

// Utility functions
function showNotification(message, type) {
  const notification = document.createElement("div")
  notification.className = `notification notification-${type}`
  notification.innerHTML = `
    <span>${message}</span>
    <button onclick="this.parentElement.remove()">&times;</button>
  `

  // Add styles if not present
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
      .notification-success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
      .notification-error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
      .notification-info { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
      .notification button {
        background: none;
        border: none;
        font-size: 1.2rem;
        cursor: pointer;
        opacity: 0.7;
        transition: opacity 0.2s;
      }
      .notification button:hover {
        opacity: 1;
      }
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `
    document.head.appendChild(styles)
  }

  document.body.appendChild(notification)
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove()
    }
  }, 5000)
}

function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }

  return text.replace(/[&<>"']/g, (m) => map[m])
}

function capitalizeFirst(string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

function formatDate(date) {
  const options = { year: "numeric", month: "long", day: "numeric" }
  return date.toLocaleDateString(undefined, options)
}