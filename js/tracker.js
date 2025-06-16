
let plants = []
let currentEditingPlant = null

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
  renderPlants()
  updateTrackerStats()
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

function savePlantsToStorage() {
  try {
    localStorage.setItem("grovi_plants", JSON.stringify(plants))
  } catch (error) {
    console.error("Error saving plants:", error)
    showNotification("Error saving data", "error")
  }
}

function setupEventListeners() {
  const addPlantBtn = document.getElementById("add-plant-btn")
  const plantForm = document.getElementById("plant-form")
  const statusFilter = document.getElementById("status-filter")
  const typeFilter = document.getElementById("type-filter")
  const plantSearch = document.getElementById("plant-search")

  if (addPlantBtn) {
    addPlantBtn.addEventListener("click", openAddPlantModal)
  }

  if (plantForm) {
    plantForm.addEventListener("submit", handlePlantFormSubmit)
  }

  if (statusFilter) {
    statusFilter.addEventListener("change", filterPlants)
  }

  if (typeFilter) {
    typeFilter.addEventListener("change", filterPlants)
  }

  if (plantSearch) {
    plantSearch.addEventListener("input", filterPlants)
  }
}

function openAddPlantModal() {
  const modal = document.getElementById("add-plant-modal")
  const modalTitle = document.getElementById("modal-title")
  const submitBtn = document.getElementById("submit-btn")

  if (modal) {
    currentEditingPlant = null
    modalTitle.textContent = "Add New Plant"
    submitBtn.textContent = "Add Plant"
    resetPlantForm()
    modal.classList.add("show")
  }
}

function closeAddPlantModal() {
  const modal = document.getElementById("add-plant-modal")
  if (modal) {
    modal.classList.remove("show")
    resetPlantForm()
    currentEditingPlant = null
  }
}

function resetPlantForm() {
  const form = document.getElementById("plant-form")
  if (form) {
    form.reset()
  }
}

function handlePlantFormSubmit(e) {
  e.preventDefault()

  const formData = new FormData(e.target)
  const plantData = {
    name: formData.get("name").trim(),
    type: formData.get("type"),
    wateringFrequency: Number.parseInt(formData.get("wateringFrequency")),
    location: formData.get("location").trim(),
    notes: formData.get("notes").trim(),
    lastWatered: formData.get("lastWatered") ? new Date(formData.get("lastWatered")) : null,
  }

  if (!plantData.name || !plantData.type || !plantData.wateringFrequency) {
    showNotification("Please fill in all required fields", "error")
    return
  }

  if (currentEditingPlant) {
    Object.assign(currentEditingPlant, plantData)
    showNotification("Plant updated successfully!", "success")
  } else {
    const newPlant = {
      id: generateId(),
      ...plantData,
      dateAdded: new Date(),
    }
    plants.push(newPlant)
    showNotification("Plant added successfully!", "success")
  }

  savePlantsToStorage()
  renderPlants()
  updateTrackerStats()
  closeAddPlantModal()
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

function filterPlants() {
  const statusFilter = document.getElementById("status-filter")
  const typeFilter = document.getElementById("type-filter")
  const plantSearch = document.getElementById("plant-search")

  let filteredPlants = [...plants]

  if (statusFilter && statusFilter.value !== "all") {
    filteredPlants = filteredPlants.filter((plant) => {
      const status = getWateringStatus(plant)
      switch (statusFilter.value) {
        case "needs-water":
          return status.class === "status-due"
        case "overdue":
          return status.class === "status-overdue"
        case "healthy":
          return status.class === "status-good"
        default:
          return true
      }
    })
  }

  if (typeFilter && typeFilter.value !== "all") {
    filteredPlants = filteredPlants.filter((plant) => plant.type === typeFilter.value)
  }

  if (plantSearch && plantSearch.value.trim()) {
    const searchTerm = plantSearch.value.trim().toLowerCase()
    filteredPlants = filteredPlants.filter(
      (plant) =>
        plant.name.toLowerCase().includes(searchTerm) ||
        plant.type.toLowerCase().includes(searchTerm) ||
        (plant.location && plant.location.toLowerCase().includes(searchTerm)),
    )
  }

  renderPlants(filteredPlants)
}

function renderPlants(plantsToRender = plants) {
  const plantsGrid = document.getElementById("plants-grid")
  const emptyState = document.getElementById("empty-state")

  if (!plantsGrid) return

  if (plantsToRender.length === 0) {
    plantsGrid.style.display = "none"
    if (emptyState) emptyState.style.display = "block"
    return
  }

  plantsGrid.style.display = "grid"
  if (emptyState) emptyState.style.display = "none"

  plantsGrid.innerHTML = plantsToRender.map((plant) => createPlantCard(plant)).join("")

  // Add event listeners
  plantsGrid.querySelectorAll(".plant-card").forEach((card) => {
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
        openEditPlantModal(plantId)
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

function waterPlant(plantId) {
  const plant = plants.find((p) => p.id === plantId)
  if (!plant) return

  plant.lastWatered = new Date()
  savePlantsToStorage()
  renderPlants()
  updateTrackerStats()

  showNotification(`${plant.name} has been watered! 💧`, "success")
}

function openEditPlantModal(plantId) {
  const plant = plants.find((p) => p.id === plantId)
  if (!plant) return

  const modal = document.getElementById("add-plant-modal")
  const modalTitle = document.getElementById("modal-title")
  const submitBtn = document.getElementById("submit-btn")

  if (modal) {
    currentEditingPlant = plant
    modalTitle.textContent = "Edit Plant"
    submitBtn.textContent = "Update Plant"

    document.getElementById("plant-name").value = plant.name
    document.getElementById("plant-type").value = plant.type
    document.getElementById("watering-frequency").value = plant.wateringFrequency
    document.getElementById("plant-location").value = plant.location || ""
    document.getElementById("plant-notes").value = plant.notes || ""

    if (plant.lastWatered) {
      document.getElementById("last-watered").value = plant.lastWatered.toISOString().split("T")[0]
    }

    modal.classList.add("show")
  }
}

function deletePlant(plantId) {
  const plant = plants.find((p) => p.id === plantId)
  if (!plant) return

  if (confirm(`Are you sure you want to delete ${plant.name}?`)) {
    plants = plants.filter((p) => p.id !== plantId)
    savePlantsToStorage()
    renderPlants()
    updateTrackerStats()
    showNotification(`${plant.name} has been removed.`, "info")
  }
}

function updateTrackerStats() {
  const totalPlantsElement = document.getElementById("total-plants")
  const needsWaterElement = document.getElementById("needs-water")
  const healthyPlantsElement = document.getElementById("healthy-plants")

  if (totalPlantsElement) {
    totalPlantsElement.textContent = plants.length
  }

  if (needsWaterElement) {
    const needsWater = plants.filter((plant) => {
      const status = getWateringStatus(plant)
      return status.class === "status-due" || status.class === "status-overdue"
    }).length
    needsWaterElement.textContent = needsWater
  }

  if (healthyPlantsElement) {
    const healthy = plants.filter((plant) => {
      const status = getWateringStatus(plant)
      return status.class === "status-good"
    }).length
    healthyPlantsElement.textContent = healthy
  }
}

window.openAddPlantModal = openAddPlantModal
window.closeAddPlantModal = closeAddPlantModal

// Mock functions to resolve errors. In a real application, these would be defined elsewhere.
function showNotification(message, type) {
  console.log(`Notification: ${message} (Type: ${type})`)
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