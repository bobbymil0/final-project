// Plant Care Tracker - Main JavaScript File

// Global variables
let plants = []
let currentEditingPlant = null

// Plant type emojis for visual representation
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

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  initializeApp()
})

function initializeApp() {
  loadPlantsFromStorage()
  setupEventListeners()
  updateUI()

  // Initialize page-specific functionality
  const currentPage = getCurrentPage()
  switch (currentPage) {
    case "index":
      initializeHomePage()
      break
    case "tracker":
      initializeTrackerPage()
      break
    case "gallery":
      initializeGalleryPage()
      break
    case "about":
      initializeAboutPage()
      break
    case "contact":
      initializeContactPage()
      break
  }
}

function getCurrentPage() {
  const path = window.location.pathname
  const page = path.split("/").pop().split(".")[0]
  return page || "index"
}

// Local Storage Functions
function savePlantsToStorage() {
  try {
    localStorage.setItem("plantpal_plants", JSON.stringify(plants))
  } catch (error) {
    console.error("Error saving plants to storage:", error)
    showNotification("Error saving data", "error")
  }
}

function loadPlantsFromStorage() {
  try {
    const storedPlants = localStorage.getItem("plantpal_plants")
    if (storedPlants) {
      plants = JSON.parse(storedPlants)
      // Convert date strings back to Date objects
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
    console.error("Error loading plants from storage:", error)
    plants = []
  }
}

// Event Listeners Setup
function setupEventListeners() {
  // Mobile navigation
  const hamburger = document.querySelector(".hamburger")
  const navMenu = document.querySelector(".nav-menu")

  if (hamburger && navMenu) {
    hamburger.addEventListener("click", () => {
      hamburger.classList.toggle("active")
      navMenu.classList.toggle("active")
    })

    // Close mobile menu when clicking on a link
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", () => {
        hamburger.classList.remove("active")
        navMenu.classList.remove("active")
      })
    })
  }

  // Modal close functionality
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal") || e.target.classList.contains("close")) {
      closeAllModals()
    }
  })

  // Escape key to close modals
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeAllModals()
    }
  })
}

// Home Page Functions
function initializeHomePage() {
  animateStats()
  setupTipModals()
}

function animateStats() {
  const statNumbers = document.querySelectorAll(".stat-number[data-target]")

  const animateNumber = (element) => {
    const target = Number.parseInt(element.getAttribute("data-target"))
    const increment = target / 100
    let current = 0

    const timer = setInterval(() => {
      current += increment
      if (current >= target) {
        current = target
        clearInterval(timer)
      }
      element.textContent = Math.floor(current)
    }, 20)
  }

  // Use Intersection Observer to trigger animation when visible
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateNumber(entry.target)
        observer.unobserve(entry.target)
      }
    })
  })

  statNumbers.forEach((stat) => observer.observe(stat))
}

function setupTipModals() {
  const tipModal = document.getElementById("tip-modal")
  if (!tipModal) return

  const tipTitle = document.getElementById("tip-title")
  const tipContent = document.getElementById("tip-content")

  const tips = {
    watering: {
      title: "Watering Your Plants",
      content:
        "Check soil moisture by inserting your finger 1-2 inches deep. Water thoroughly until water drains from the bottom. Most plants prefer to dry out slightly between waterings.",
    },
    light: {
      title: "Light Requirements",
      content:
        "Most houseplants prefer bright, indirect light. Direct sunlight can burn leaves, while too little light causes leggy growth. Rotate plants weekly for even growth.",
    },
    soil: {
      title: "Soil Care",
      content:
        "Use well-draining potting mix appropriate for your plant type. Repot when roots become crowded, typically every 1-2 years. Fresh soil provides essential nutrients.",
    },
  }

  window.showTip = (tipType) => {
    const tip = tips[tipType]
    if (tip) {
      tipTitle.textContent = tip.title
      tipContent.textContent = tip.content
      tipModal.classList.add("show")
    }
  }
}

// Tracker Page Functions
function initializeTrackerPage() {
  const addPlantBtn = document.getElementById("add-plant-btn")
  const plantForm = document.getElementById("plant-form")

  if (addPlantBtn) {
    addPlantBtn.addEventListener("click", openAddPlantModal)
  }

  if (plantForm) {
    plantForm.addEventListener("submit", handlePlantFormSubmit)
    setupFormValidation()
  }

  renderPlants()
  updateTrackerStats()
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

    // Focus on first input
    const firstInput = modal.querySelector("input")
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100)
    }
  }
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

    // Populate form with plant data
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
    clearFormErrors()
  }
}

function setupFormValidation() {
  const form = document.getElementById("plant-form")
  if (!form) return

  const inputs = form.querySelectorAll("input, select, textarea")
  inputs.forEach((input) => {
    input.addEventListener("blur", () => validateField(input))
    input.addEventListener("input", () => clearFieldError(input))
  })
}

function validateField(field) {
  const value = field.value.trim()
  const fieldName = field.name
  let isValid = true
  let errorMessage = ""

  switch (fieldName) {
    case "name":
      if (!value) {
        errorMessage = "Plant name is required"
        isValid = false
      } else if (value.length < 2) {
        errorMessage = "Plant name must be at least 2 characters"
        isValid = false
      }
      break

    case "type":
      if (!value) {
        errorMessage = "Please select a plant type"
        isValid = false
      }
      break

    case "wateringFrequency":
      if (!value) {
        errorMessage = "Watering frequency is required"
        isValid = false
      } else if (value < 1 || value > 30) {
        errorMessage = "Watering frequency must be between 1 and 30 days"
        isValid = false
      }
      break
  }

  if (!isValid) {
    showFieldError(field, errorMessage)
  } else {
    clearFieldError(field)
  }

  return isValid
}

function showFieldError(field, message) {
  field.classList.add("error")
  const errorElement = document.getElementById(field.name + "-error")
  if (errorElement) {
    errorElement.textContent = message
  }
}

function clearFieldError(field) {
  field.classList.remove("error")
  const errorElement = document.getElementById(field.name + "-error")
  if (errorElement) {
    errorElement.textContent = ""
  }
}

function clearFormErrors() {
  const form = document.getElementById("plant-form")
  if (!form) return

  const errorElements = form.querySelectorAll(".error-message")
  errorElements.forEach((element) => {
    element.textContent = ""
  })

  const errorFields = form.querySelectorAll(".error")
  errorFields.forEach((field) => {
    field.classList.remove("error")
  })
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

  // Validate form
  let isValid = true
  const requiredFields = ["name", "type", "wateringFrequency"]

  requiredFields.forEach((fieldName) => {
    const field = document.querySelector(`[name="${fieldName}"]`)
    if (!validateField(field)) {
      isValid = false
    }
  })

  if (!isValid) {
    showNotification("Please fix the errors in the form", "error")
    return
  }

  if (currentEditingPlant) {
    // Update existing plant
    Object.assign(currentEditingPlant, plantData)
    showNotification("Plant updated successfully!", "success")
  } else {
    // Add new plant
    const newPlant = {
      id: generateId(),
      ...plantData,
      dateAdded: new Date(),
      wateringHistory: [],
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

function renderPlants() {
  const plantsGrid = document.getElementById("plants-grid")
  const emptyState = document.getElementById("empty-state")

  if (!plantsGrid) return

  if (plants.length === 0) {
    plantsGrid.style.display = "none"
    if (emptyState) emptyState.style.display = "block"
    return
  }

  plantsGrid.style.display = "grid"
  if (emptyState) emptyState.style.display = "none"

  plantsGrid.innerHTML = plants.map((plant) => createPlantCard(plant)).join("")

  // Add event listeners to plant cards
  plantsGrid.querySelectorAll(".plant-card").forEach((card) => {
    const plantId = card.dataset.plantId

    // Water button
    const waterBtn = card.querySelector(".btn-water")
    if (waterBtn) {
      waterBtn.addEventListener("click", (e) => {
        e.stopPropagation()
        waterPlant(plantId)
      })
    }

    // Edit button
    const editBtn = card.querySelector(".btn-edit")
    if (editBtn) {
      editBtn.addEventListener("click", (e) => {
        e.stopPropagation()
        openEditPlantModal(plantId)
      })
    }

    // Delete button
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
  const daysSinceWatered = getDaysSinceWatered(plant)

  return `
        <div class="plant-card" data-plant-id="${plant.id}">
            <div class="plant-header">
                <div class="plant-info">
                    <h3>${escapeHtml(plant.name)} ${plantEmojis[plant.type] || "🪴"}</h3>
                    <span class="plant-type">${capitalizeFirst(plant.type)}</span>
                </div>
                <div class="plant-actions">
                    <button class="btn-icon btn-water" title="Water Plant" aria-label="Water ${plant.name}">
                        💧
                    </button>
                    <button class="btn-icon btn-edit" title="Edit Plant" aria-label="Edit ${plant.name}">
                        ✏️
                    </button>
                    <button class="btn-icon btn-delete" title="Delete Plant" aria-label="Delete ${plant.name}">
                        🗑️
                    </button>
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
                <span class="status-icon">${wateringStatus.icon}</span>
                <span class="status-text">${wateringStatus.text}</span>
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
    return {
      class: "status-overdue",
      icon: "⚠️",
      text: "Never watered",
    }
  }

  const daysSince = getDaysSinceWatered(plant)
  const frequency = plant.wateringFrequency

  if (daysSince >= frequency + 2) {
    return {
      class: "status-overdue",
      icon: "🚨",
      text: `Overdue by ${daysSince - frequency} days`,
    }
  } else if (daysSince >= frequency) {
    return {
      class: "status-due",
      icon: "💧",
      text: "Needs watering",
    }
  } else {
    const daysUntilNext = frequency - daysSince
    return {
      class: "status-good",
      icon: "✅",
      text: `Water in ${daysUntilNext} days`,
    }
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
  if (!plant.wateringHistory) {
    plant.wateringHistory = []
  }
  plant.wateringHistory.push(new Date())

  savePlantsToStorage()
  renderPlants()
  updateTrackerStats()

  showNotification(`${plant.name} has been watered! 💧`, "success")
}

function deletePlant(plantId) {
  const plant = plants.find((p) => p.id === plantId)
  if (!plant) return

  if (confirm(`Are you sure you want to delete ${plant.name}? This action cannot be undone.`)) {
    plants = plants.filter((p) => p.id !== plantId)
    savePlantsToStorage()
    renderPlants()
    updateTrackerStats()
    showNotification(`${plant.name} has been removed from your garden.`, "info")
  }
}

function updateTrackerStats() {
  const totalPlantsElement = document.getElementById("total-plants")
  const needsWaterElement = document.getElementById("needs-water")

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
}

// Gallery Page Functions
function initializeGalleryPage() {
  const typeFilter = document.getElementById("type-filter")
  const sortBy = document.getElementById("sort-by")
  const gridViewBtn = document.getElementById("grid-view")
  const listViewBtn = document.getElementById("list-view")

  if (typeFilter) {
    typeFilter.addEventListener("change", filterAndSortPlants)
  }

  if (sortBy) {
    sortBy.addEventListener("change", filterAndSortPlants)
  }

  if (gridViewBtn) {
    gridViewBtn.addEventListener("click", () => setGalleryView("grid"))
  }

  if (listViewBtn) {
    listViewBtn.addEventListener("click", () => setGalleryView("list"))
  }

  renderGallery()
  updateGalleryStats()
}

function setGalleryView(viewType) {
  const container = document.getElementById("gallery-container")
  const gridBtn = document.getElementById("grid-view")
  const listBtn = document.getElementById("list-view")

  if (container) {
    container.className = `gallery-container ${viewType}-view`
  }

  if (gridBtn && listBtn) {
    gridBtn.classList.toggle("active", viewType === "grid")
    listBtn.classList.toggle("active", viewType === "list")
  }
}

function filterAndSortPlants() {
  const typeFilter = document.getElementById("type-filter")
  const sortBy = document.getElementById("sort-by")

  let filteredPlants = [...plants]

  // Apply type filter
  if (typeFilter && typeFilter.value !== "all") {
    filteredPlants = filteredPlants.filter((plant) => plant.type === typeFilter.value)
  }

  // Apply sorting
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
          return new Date(b.lastWatered) - new Date(a.lastWatered)
        case "nextWatering":
          const aNext = a.lastWatered
            ? new Date(a.lastWatered.getTime() + a.wateringFrequency * 24 * 60 * 60 * 1000)
            : new Date(0)
          const bNext = b.lastWatered
            ? new Date(b.lastWatered.getTime() + b.wateringFrequency * 24 * 60 * 60 * 1000)
            : new Date(0)
          return aNext - bNext
        default:
          return 0
      }
    })
  }

  renderGallery(filteredPlants)
}

function renderGallery(plantsToRender = plants) {
  const galleryContainer = document.getElementById("gallery-container")
  const emptyState = document.getElementById("gallery-empty")

  if (!galleryContainer) return

  if (plantsToRender.length === 0) {
    galleryContainer.style.display = "none"
    if (emptyState) emptyState.style.display = "block"
    return
  }

  galleryContainer.style.display = "grid"
  if (emptyState) emptyState.style.display = "none"

  galleryContainer.innerHTML = plantsToRender.map((plant) => createPlantCard(plant)).join("")

  // Add event listeners (reuse from tracker page)
  galleryContainer.querySelectorAll(".plant-card").forEach((card) => {
    const plantId = card.dataset.plantId

    const waterBtn = card.querySelector(".btn-water")
    if (waterBtn) {
      waterBtn.addEventListener("click", (e) => {
        e.stopPropagation()
        waterPlant(plantId)
        // Re-render gallery to update stats
        setTimeout(() => {
          filterAndSortPlants()
          updateGalleryStats()
        }, 100)
      })
    }

    const editBtn = card.querySelector(".btn-edit")
    if (editBtn) {
      editBtn.addEventListener("click", (e) => {
        e.stopPropagation()
        // Redirect to tracker page for editing
        window.location.href = `tracker.html?edit=${plantId}`
      })
    }

    const deleteBtn = card.querySelector(".btn-delete")
    if (deleteBtn) {
      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation()
        deletePlant(plantId)
        setTimeout(() => {
          filterAndSortPlants()
          updateGalleryStats()
        }, 100)
      })
    }
  })
}

function updateGalleryStats() {
  const totalElement = document.getElementById("gallery-total")
  const wateredElement = document.getElementById("gallery-watered")
  const overdueElement = document.getElementById("gallery-overdue")

  if (totalElement) {
    totalElement.textContent = plants.length
  }

  if (wateredElement) {
    const today = new Date()
    const wateredToday = plants.filter((plant) => {
      if (!plant.lastWatered) return false
      const lastWatered = new Date(plant.lastWatered)
      return lastWatered.toDateString() === today.toDateString()
    }).length
    wateredElement.textContent = wateredToday
  }

  if (overdueElement) {
    const overdue = plants.filter((plant) => {
      const status = getWateringStatus(plant)
      return status.class === "status-overdue"
    }).length
    overdueElement.textContent = overdue
  }
}

// About Page Functions
function initializeAboutPage() {
  setupTipCards()
}

function setupTipCards() {
  const tipCards = document.querySelectorAll(".tip-card")

  tipCards.forEach((card) => {
    card.addEventListener("click", function () {
      toggleTip(this)
    })
  })
}

function toggleTip(card) {
  const isActive = card.classList.contains("active")

  // Close all other tip cards
  document.querySelectorAll(".tip-card").forEach((otherCard) => {
    if (otherCard !== card) {
      otherCard.classList.remove("active")
    }
  })

  // Toggle current card
  card.classList.toggle("active", !isActive)
}

// Contact Page Functions
function initializeContactPage() {
  const contactForm = document.getElementById("contact-form")
  const messageTextarea = document.getElementById("message")
  const charCount = document.getElementById("char-count")

  if (contactForm) {
    contactForm.addEventListener("submit", handleContactFormSubmit)
    setupContactFormValidation()
  }

  if (messageTextarea && charCount) {
    messageTextarea.addEventListener("input", function () {
      const count = this.value.length
      charCount.textContent = count

      if (count > 500) {
        charCount.style.color = "var(--danger)"
        this.style.borderColor = "var(--danger)"
      } else {
        charCount.style.color = "var(--gray)"
        this.style.borderColor = ""
      }
    })
  }

  setupFaqItems()
}

function setupContactFormValidation() {
  const form = document.getElementById("contact-form")
  if (!form) return

  const inputs = form.querySelectorAll("input, select, textarea")
  inputs.forEach((input) => {
    input.addEventListener("blur", () => validateContactField(input))
    input.addEventListener("input", () => clearContactFieldError(input))
  })
}

function validateContactField(field) {
  const value = field.value.trim()
  const fieldName = field.name
  let isValid = true
  let errorMessage = ""

  switch (fieldName) {
    case "firstName":
    case "lastName":
      if (!value) {
        errorMessage = `${fieldName === "firstName" ? "First" : "Last"} name is required`
        isValid = false
      } else if (value.length < 2) {
        errorMessage = "Name must be at least 2 characters"
        isValid = false
      }
      break

    case "email":
      if (!value) {
        errorMessage = "Email address is required"
        isValid = false
      } else if (!isValidEmail(value)) {
        errorMessage = "Please enter a valid email address"
        isValid = false
      }
      break

    case "subject":
      if (!value) {
        errorMessage = "Please select a subject"
        isValid = false
      }
      break

    case "message":
      if (!value) {
        errorMessage = "Message is required"
        isValid = false
      } else if (value.length < 10) {
        errorMessage = "Message must be at least 10 characters"
        isValid = false
      } else if (value.length > 500) {
        errorMessage = "Message must be less than 500 characters"
        isValid = false
      }
      break

    case "terms":
      if (field.type === "checkbox" && !field.checked) {
        errorMessage = "You must agree to the terms and conditions"
        isValid = false
      }
      break
  }

  if (!isValid) {
    showContactFieldError(field, errorMessage)
  } else {
    clearContactFieldError(field)
  }

  return isValid
}

function showContactFieldError(field, message) {
  field.classList.add("error")
  const errorElement = document.getElementById(field.name + "-error")
  if (errorElement) {
    errorElement.textContent = message
  }
}

function clearContactFieldError(field) {
  field.classList.remove("error")
  const errorElement = document.getElementById(field.name + "-error")
  if (errorElement) {
    errorElement.textContent = ""
  }
}

function handleContactFormSubmit(e) {
  e.preventDefault()

  const form = e.target
  const formData = new FormData(form)

  // Validate all fields
  let isValid = true
  const requiredFields = ["firstName", "lastName", "email", "subject", "message", "terms"]

  requiredFields.forEach((fieldName) => {
    const field = form.querySelector(`[name="${fieldName}"]`)
    if (field && !validateContactField(field)) {
      isValid = false
    }
  })

  if (!isValid) {
    showNotification("Please fix the errors in the form", "error")
    return
  }

  // Simulate form submission
  const submitBtn = form.querySelector('button[type="submit"]')
  const originalText = submitBtn.textContent

  submitBtn.textContent = "Sending..."
  submitBtn.disabled = true

  setTimeout(() => {
    // Show success message
    const formSection = document.querySelector(".contact-form-section")
    const successMessage = document.getElementById("form-success")

    if (formSection && successMessage) {
      formSection.style.display = "none"
      successMessage.style.display = "block"
    }

    // Reset form
    form.reset()
    clearContactFormErrors()

    showNotification("Message sent successfully!", "success")

    // Reset button
    submitBtn.textContent = originalText
    submitBtn.disabled = false

    // Reset form visibility after 5 seconds
    setTimeout(() => {
      if (formSection && successMessage) {
        formSection.style.display = "block"
        successMessage.style.display = "none"
      }
    }, 5000)
  }, 2000)
}

function clearContactFormErrors() {
  const form = document.getElementById("contact-form")
  if (!form) return

  const errorElements = form.querySelectorAll(".error-message")
  errorElements.forEach((element) => {
    element.textContent = ""
  })

  const errorFields = form.querySelectorAll(".error")
  errorFields.forEach((field) => {
    field.classList.remove("error")
  })
}

function setupFaqItems() {
  const faqItems = document.querySelectorAll(".faq-item")

  faqItems.forEach((item) => {
    item.addEventListener("click", function () {
      toggleFaq(this)
    })
  })
}

function toggleFaq(item) {
  const isActive = item.classList.contains("active")

  // Close all other FAQ items
  document.querySelectorAll(".faq-item").forEach((otherItem) => {
    if (otherItem !== item) {
      otherItem.classList.remove("active")
    }
  })

  // Toggle current item
  item.classList.toggle("active", !isActive)
}

// Utility Functions
function closeAllModals() {
  const modals = document.querySelectorAll(".modal")
  modals.forEach((modal) => {
    modal.classList.remove("show")
  })

  // Reset any editing state
  currentEditingPlant = null
}

function updateUI() {
  // Update navigation active states
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

function showNotification(message, type = "info") {
  // Create notification element
  const notification = document.createElement("div")
  notification.className = `notification notification-${type}`
  notification.innerHTML = `
        <span class="notification-message">${escapeHtml(message)}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">&times;</button>
    `

  // Add notification styles if not already present
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
                animation: slideInRight 0.3s ease-out;
            }
            
            .notification-success {
                background: #d4edda;
                color: #155724;
                border: 1px solid #c3e6cb;
            }
            
            .notification-error {
                background: #f8d7da;
                color: #721c24;
                border: 1px solid #f5c6cb;
            }
            
            .notification-info {
                background: #d1ecf1;
                color: #0c5460;
                border: 1px solid #bee5eb;
            }
            
            .notification-close {
                background: none;
                border: none;
                font-size: 1.2rem;
                cursor: pointer;
                opacity: 0.7;
                transition: opacity 0.2s;
            }
            
            .notification-close:hover {
                opacity: 1;
            }
            
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `
    document.head.appendChild(styles)
  }

  // Add to page
  document.body.appendChild(notification)

  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove()
    }
  }, 5000)
}

function formatDate(date) {
  if (!date) return "Never"

  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return "Today"
  } else if (diffDays === 1) {
    return "Yesterday"
  } else if (diffDays < 7) {
    return `${diffDays} days ago`
  } else {
    return date.toLocaleDateString()
  }
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function escapeHtml(text) {
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Handle URL parameters (for editing plants from gallery)
window.addEventListener("load", () => {
  const urlParams = new URLSearchParams(window.location.search)
  const editPlantId = urlParams.get("edit")

  if (editPlantId && getCurrentPage() === "tracker") {
    // Wait for page to initialize, then open edit modal
    setTimeout(() => {
      openEditPlantModal(editPlantId)
    }, 500)
  }
})


window.openAddPlantModal = openAddPlantModal
window.closeAddPlantModal = closeAddPlantModal
window.toggleTip = toggleTip
window.toggleFaq = toggleFaq
window.showTip = showTip