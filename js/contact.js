
document.addEventListener("DOMContentLoaded", () => {
  setupContactForm()
})

function setupContactForm() {
  const contactForm = document.getElementById("contact-form")

  if (contactForm) {
    contactForm.addEventListener("submit", handleContactFormSubmit)
  }
}

function handleContactFormSubmit(e) {
  e.preventDefault()

  const formData = new FormData(e.target)
  const contactData = {
    firstName: formData.get("firstName").trim(),
    lastName: formData.get("lastName").trim(),
    email: formData.get("email").trim(),
    subject: formData.get("subject"),
    message: formData.get("message").trim(),
  }

  // Validate form data
  if (
    !contactData.firstName ||
    !contactData.lastName ||
    !contactData.email ||
    !contactData.subject ||
    !contactData.message
  ) {
    showNotification("Please fill in all required fields", "error")
    return
  }

  if (!isValidEmail(contactData.email)) {
    showNotification("Please enter a valid email address", "error")
    return
  }

  // Simulate form submission
  simulateFormSubmission(contactData)
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function simulateFormSubmission(contactData) {
  // Show loading state
  const submitBtn = document.querySelector('button[type="submit"]')
  const originalText = submitBtn.textContent
  submitBtn.textContent = "Sending..."
  submitBtn.disabled = true

  // Simulate API call delay
  setTimeout(() => {
    // Hide form and show success message
    const contactForm = document.getElementById("contact-form")
    const successMessage = document.getElementById("form-success")

    if (contactForm && successMessage) {
      contactForm.style.display = "none"
      successMessage.style.display = "block"
    }

    // Log the form data (in a real app, this would be sent to a server)
    console.log("Contact form submitted:", contactData)

    // Reset button state
    submitBtn.textContent = originalText
    submitBtn.disabled = false

    showNotification("Message sent successfully!", "success")
  }, 1500)
}

// Mock function to resolve errors. In a real application, this would be defined elsewhere.
function showNotification(message, type) {
  console.log(`Notification: ${message} (Type: ${type})`)
}