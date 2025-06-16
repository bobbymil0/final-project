
let plants = []

document.addEventListener("DOMContentLoaded", () => {
  loadPlantsFromStorage()
  updateHomeStats()
  updateTodaysTasks()
  setupQuickActions()
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

function updateHomeStats() {
  const heroPlants = document.getElementById("hero-plants")
  const heroDays = document.getElementById("hero-days")

  if (heroPlants) {
    heroPlants.textContent = plants.length
  }

  if (heroDays) {
    const firstPlantDate =
      plants.length > 0
        ? Math.min(...plants.map((p) => (p.dateAdded ? p.dateAdded.getTime() : Date.now())))
        : Date.now()
    const daysSinceFirst = Math.floor((Date.now() - firstPlantDate) / (1000 * 60 * 60 * 24))
    heroDays.textContent = Math.max(daysSinceFirst, 0)
  }
}

function updateTodaysTasks() {
  const tasksWater = document.getElementById("tasks-water")
  const tasksOverdue = document.getElementById("tasks-overdue")
  const tasksUpcoming = document.getElementById("tasks-upcoming")
  const tasksList = document.getElementById("tasks-list")

  if (!tasksWater || !tasksList) return

  const needsWater = plants.filter((plant) => {
    const status = getWateringStatus(plant)
    return status.class === "status-due"
  })

  const overdue = plants.filter((plant) => {
    const status = getWateringStatus(plant)
    return status.class === "status-overdue"
  })

  const upcoming = plants.filter((plant) => {
    if (!plant.lastWatered) return false
    const nextWateringDate = new Date(plant.lastWatered)
    nextWateringDate.setDate(nextWateringDate.getDate() + plant.wateringFrequency)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dayAfter = new Date()
    dayAfter.setDate(dayAfter.getDate() + 2)
    return nextWateringDate >= tomorrow && nextWateringDate <= dayAfter
  })

  tasksWater.textContent = needsWater.length
  if (tasksOverdue) tasksOverdue.textContent = overdue.length
  if (tasksUpcoming) tasksUpcoming.textContent = upcoming.length

  const allTasks = [...overdue, ...needsWater]
  if (allTasks.length === 0) {
    tasksList.innerHTML = `
      <div class="no-tasks">
        <div class="no-tasks-icon">✅</div>
        <p>All caught up! Your plants are happy today.</p>
      </div>
    `
  } else {
    tasksList.innerHTML = allTasks
      .map(
        (plant) => `
        <div class="task-item" onclick="window.location.href='tracker.html'">
          <span class="task-name">${escapeHtml(plant.name)}</span>
          <span class="task-action">${overdue.includes(plant) ? "Overdue!" : "Needs water"}</span>
        </div>
      `,
      )
      .join("")
  }
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

function setupQuickActions() {
  // Export data functionality
  const exportCard = document.querySelector('.quick-action-card[onclick*="exportData"]')
  if (exportCard) {
    exportCard.addEventListener("click", exportData)
  }
}

function escapeHtml(text) {
  var map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }

  return text.replace(/[&<>"']/g, (m) => map[m])
}

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

function exportData() {
  try {
    const dataToExport = {
      plants: plants,
      exportDate: new Date().toISOString(),
      version: "1.0",
    }

    const dataStr = JSON.stringify(dataToExport, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })

    const link = document.createElement("a")
    link.href = URL.createObjectURL(dataBlob)
    link.download = `grovi-data-${new Date().toISOString().split("T")[0]}.json`
    link.click()

    showNotification("Plant data exported successfully!", "success")
  } catch (error) {
    console.error("Export error:", error)
    showNotification("Error exporting data", "error")
  }
}

window.exportData = exportData

// Add these functions to handle weather functionality

function getWeatherData() {
  if (!navigator.geolocation) {
    showNotification("Geolocation is not supported by this browser", "error")
    return
  }

  const weatherBtn = document.querySelector('button[onclick="getWeatherData()"]')
  if (weatherBtn) {
    weatherBtn.textContent = "Getting Weather..."
    weatherBtn.disabled = true
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      // Simulate weather data (in a real app, you'd call a weather API)
      const mockWeatherData = {
        temperature: Math.floor(Math.random() * 30) + 60, // 60-90°F
        humidity: Math.floor(Math.random() * 40) + 40, // 40-80%
      }

      updateWeatherDisplay(mockWeatherData)
      generateWeatherRecommendation(mockWeatherData)

      if (weatherBtn) {
        weatherBtn.textContent = "Refresh Weather"
        weatherBtn.disabled = false
      }

      showNotification("Weather data updated!", "success")
    },
    (error) => {
      console.error("Geolocation error:", error)

      // Fallback to mock data if geolocation fails
      const mockWeatherData = {
        temperature: Math.floor(Math.random() * 30) + 65,
        humidity: Math.floor(Math.random() * 40) + 45,
      }

      updateWeatherDisplay(mockWeatherData)
      generateWeatherRecommendation(mockWeatherData)

      if (weatherBtn) {
        weatherBtn.textContent = "Get Weather"
        weatherBtn.disabled = false
      }

      showNotification("Using sample weather data", "info")
    },
  )
}

function updateWeatherDisplay(weatherData) {
  const temperature = document.getElementById("temperature")
  const humidity = document.getElementById("humidity")

  if (temperature) {
    temperature.textContent = `${weatherData.temperature}°F`
  }

  if (humidity) {
    humidity.textContent = `${weatherData.humidity}%`
  }
}

function generateWeatherRecommendation(weatherData) {
  const recommendation = document.getElementById("weather-recommendation")
  if (!recommendation) return

  let message = ""

  if (weatherData.humidity < 40) {
    message = "🌵 Low humidity detected! Consider misting your tropical plants or using a humidifier."
  } else if (weatherData.humidity > 70) {
    message = "🌿 High humidity today! Your plants are loving it. Watch for signs of fungal issues."
  } else if (weatherData.temperature > 80) {
    message = "🌡️ Hot weather alert! Your plants may need extra water today. Check soil moisture more frequently."
  } else if (weatherData.temperature < 65) {
    message = "❄️ Cool weather means slower growth. Reduce watering frequency and hold off on fertilizing."
  } else {
    message = "🌱 Perfect weather for your plants! Maintain your regular care routine."
  }

  recommendation.innerHTML = `<p>${message}</p>`
}

// Make the function globally available
window.getWeatherData = getWeatherData