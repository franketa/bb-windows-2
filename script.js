function showStep(stepNumber) {
    const steps = document.querySelectorAll('.step');
    const progressDots = document.querySelectorAll('.progress-dot');
    const progressLines = document.querySelectorAll('.progress-line');

    steps.forEach(step => step.classList.remove('active'));

    const currentStep = document.querySelector(`.step[data-step="${stepNumber}"]`);
    if (currentStep) currentStep.classList.add('active');

    updateProgress(stepNumber);
    updateHeaderBackArrow(stepNumber);
    updateStickyNavigation(stepNumber);
    
    // Handle hero content visibility
    const heroTitle = document.querySelector('.hero-content h1');
    const serviceIcons = document.querySelector('.service-icons');
    const logoIcon = document.querySelector('.logo-icon');
    
    if (stepNumber === 1) {
        // Show hero title and service icons on step 1
        if (heroTitle) heroTitle.style.display = '';
        if (serviceIcons) serviceIcons.style.display = '';
        // Reset logo size on step 1
        if (logoIcon) logoIcon.style.height = '25px';
    } else {
        // Hide hero title and service icons on other steps
        if (heroTitle) heroTitle.style.display = 'none';
        if (serviceIcons) serviceIcons.style.display = 'none';
        // Reduce logo size from step 2 onwards
        if (logoIcon) logoIcon.style.height = '20px';
    }
}

function updateProgress(currentStep) {
    const progressFill = document.getElementById('progress-fill');
    
    if (progressFill) {
        // Calculate percentage: each step is 1/6 of the total (16.67%)
        const percentage = (currentStep / 6) * 100;
        progressFill.style.width = `${percentage}%`;
    }
}

function updateHeaderBackArrow(currentStep) {
    const headerBackArrow = document.getElementById('header-back-arrow');
    if (headerBackArrow) {
        headerBackArrow.style.display = currentStep > 1 ? 'block' : 'none';
    }
}

// Function to update location text based on ZIP code using external API
function updateLocationText(zipCode) {
    const locationText = document.getElementById('location-text');
    if (locationText && zipCode && zipCode.length === 5) {
        // Show loading state
        locationText.textContent = 'Loading...';
        
        // Use Zippopotam.us API - free, no API key required
        fetch(`https://api.zippopotam.us/us/${zipCode}`)
            .then(response => {
                if (response.ok) {
                    return response.json();
                }
                throw new Error('ZIP code not found');
            })
            .then(data => {
                // Extract city and state from response
                const city = data.places[0]['place name'];
                const state = data.places[0]['state abbreviation'];
                locationText.textContent = `${city}, ${state}`;
            })
            .catch(error => {
                // Fallback if API fails or ZIP not found
                locationText.textContent = `ZIP ${zipCode}`;
            });
    }
}

function updateStickyNavigation(currentStep) {
    const navBackBtn = document.getElementById('nav-back-btn');
    const navNextBtn = document.getElementById('nav-next-btn');
    const navBtnText = document.getElementById('nav-btn-text');
    const navBtnIcon = document.getElementById('nav-btn-icon');
    const navBtnSpinner = document.getElementById('nav-btn-spinner');
    
    // Show/hide back button
    if (navBackBtn) {
        navBackBtn.style.display = currentStep > 1 ? 'block' : 'none';
    }
    
    // Update next button text and type based on step
    if (navBtnText && navBtnIcon && navNextBtn) {
        if (currentStep === 6) {
            navBtnText.textContent = 'Get Prices';
            navBtnIcon.className = 'fas fa-arrow-right';
            navNextBtn.type = 'submit';
            navNextBtn.classList.add('btn-get-prices');
        } else {
            navBtnText.textContent = 'Next';
            navBtnIcon.className = 'fas fa-arrow-right';
            navNextBtn.type = 'button';
            navNextBtn.classList.remove('btn-get-prices');
        }
        
        // Reset spinner
        if (navBtnSpinner) {
            navBtnSpinner.style.display = 'none';
        }
    }
}

function handleNextButtonClick() {
    const currentStepElement = document.querySelector('.step.active');
    if (!currentStepElement) return;
    
    const currentStep = parseInt(currentStepElement.dataset.step);
    const navBtnSpinner = document.getElementById('nav-btn-spinner');
    
    // Show spinner
    if (navBtnSpinner) {
        navBtnSpinner.style.display = 'inline-block';
    }
    
    // Blur active element and scroll to top
    document.activeElement.blur();
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
    
    let isValid = false;
    let nextStep = currentStep + 1;
    
    // Validate current step
    switch (currentStep) {
        case 1:
            isValid = validateStep1();
            if (isValid) {
                const zipInput = document.getElementById('zip');
                updateLocationText(zipInput.value);
            }
            break;
        case 2:
            isValid = validateStep2();
            break;
        case 3:
            isValid = validateStep3();
            break;
        case 4:
            // Check if location edit form is visible and handle ZIP update
            const locationEditForm = document.getElementById('location-edit-form');
            const editZipInput = document.getElementById('edit-zip');
            const editZipError = document.getElementById('error-edit-zip');
            
            if (locationEditForm && locationEditForm.style.display === 'block') {
                const newZip = editZipInput.value;
                
                if (newZip.match(/^\d{5}$/)) {
                    // Update the ZIP in step 1
                    document.getElementById('zip').value = newZip;
                    
                    // Update location text
                    updateLocationText(newZip);
                    
                    // Hide edit form and show indicator
                    editZipError.style.display = 'none';
                    locationEditForm.style.display = 'none';
                    document.getElementById('location-indicator').style.display = 'flex';
                } else {
                    editZipError.style.display = 'block';
                    if (navBtnSpinner) {
                        navBtnSpinner.style.display = 'none';
                    }
                    return; // Don't proceed if ZIP is invalid
                }
            }
            
            isValid = validateStep4();
            break;
        case 5:
            isValid = validateStep5();
            break;
        case 6:
            isValid = validateStep6();
            if (isValid) {
                handleFormSubmission();
                return; // Don't proceed to next step, form submission will handle redirect
            }
            break;
    }
    
    setTimeout(() => {
        if (isValid && nextStep <= 6) {
            showStep(nextStep);
        }
        
        // Hide spinner
        if (navBtnSpinner) {
            navBtnSpinner.style.display = 'none';
        }
    }, currentStep === 1 ? 800 : 300);
}

function handleBackButtonClick() {
    const currentStepElement = document.querySelector('.step.active');
    if (!currentStepElement) return;
    
    const currentStep = parseInt(currentStepElement.dataset.step);
    if (currentStep > 1) {
        showStep(currentStep - 1);
    }
}

function handleFormSubmission() {
    const navNextBtn = document.getElementById('nav-next-btn');
    const navBtnSpinner = document.getElementById('nav-btn-spinner');
    
    if (navNextBtn && navBtnSpinner) {
        navBtnSpinner.style.display = 'inline-block';
        navNextBtn.disabled = true;
    }

    const formData = {
        zip: document.getElementById('zip').value,
        projectScope: document.querySelector('input[name="WindowsProjectScope"]:checked')?.value,
        numberOfWindows: document.querySelector('input[name="NumberOfWindows"]:checked')?.value,
        address: document.getElementById('address').value,
        propertyOwner: document.getElementById('propertyOwner').checked,
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value
    };

    fetch('https://hook.us2.make.com/pdm6g7ey9smyfvob65947fkbh4yr1emb', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
    })
        .then(response => {
            if (response.ok) {
                window.location.href = 'thank-you.html';
            } else {
                throw new Error('Network response was not ok');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('There was a problem submitting your form. Please try again.');
            if (navNextBtn && navBtnSpinner) {
                navNextBtn.disabled = false;
                navBtnSpinner.style.display = 'none';
            }
        });
}

document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('windows-quote-form');
    const headerBackArrow = document.getElementById('header-back-arrow');
    const navBackBtn = document.getElementById('nav-back-btn');
    const navNextBtn = document.getElementById('nav-next-btn');
    
    // Header back arrow functionality
    if (headerBackArrow) {
        headerBackArrow.addEventListener('click', handleBackButtonClick);
    }
    
    // Sticky navigation event listeners
    if (navBackBtn) {
        navBackBtn.addEventListener('click', handleBackButtonClick);
    }
    
    if (navNextBtn) {
        navNextBtn.addEventListener('click', function(e) {
            e.preventDefault();
            handleNextButtonClick();
        });
    }
    
    // Initialize
    showStep(1);
    document.querySelectorAll('.form-group-error-message').forEach(error => {
        error.style.display = 'none';
    });



    // ZIP code input formatting
    document.getElementById('zip').addEventListener('input', function (e) {
        this.value = this.value.replace(/[^0-9]/g, '');
        
        // Hide hero content when user starts typing
        const heroContent = document.querySelector('.hero-content');
        if (heroContent && this.value.length > 0) {
            heroContent.style.display = 'none';
        } else if (heroContent && this.value.length === 0) {
            heroContent.style.display = '';
        }
    });

    // Step 2: Visual option cards (Replace/Repair) - Auto-advance functionality
    const visualOptionCards = document.querySelectorAll('.visual-option-card');
    visualOptionCards.forEach(card => {
        card.addEventListener('click', function () {
            const radio = this.querySelector('input[type="radio"]');
            if (radio) {
                radio.checked = true;
                
                // Auto-advance after selection
                setTimeout(() => {
                    if (validateStep2()) {
                        showStep(3);
                    }
                }, 500);
            }
        });
    });

    // Step 3: Number options - Auto-advance functionality
    const numberOptions = document.querySelectorAll('.number-option');
    numberOptions.forEach(option => {
        option.addEventListener('click', function () {
            const radio = this.querySelector('input[type="radio"]');
            if (radio) {
                radio.checked = true;
                
                // Auto-advance after selection
                setTimeout(() => {
                    if (validateStep3()) {
                        showStep(4);
                    }
                }, 500);
            }
        });
    });

    // Location indicator functionality
    const locationIndicator = document.getElementById('location-indicator');
    const locationEditForm = document.getElementById('location-edit-form');
    const editZipInput = document.getElementById('edit-zip');
    const locationText = document.getElementById('location-text');
    const editZipError = document.getElementById('error-edit-zip');

    if (locationIndicator) {
        locationIndicator.addEventListener('click', function() {
            // Get the current ZIP value from step 1
            const currentZip = document.getElementById('zip').value;
            editZipInput.value = currentZip;
            
            // Show the edit form and hide the indicator
            locationIndicator.style.display = 'none';
            locationEditForm.style.display = 'block';
            editZipInput.focus();
        });
    }

    // Format edit ZIP input
    if (editZipInput) {
        editZipInput.addEventListener('input', function (e) {
            this.value = this.value.replace(/[^0-9]/g, '');
        });
    }

    // Location indicator and edit form functionality handles ZIP updates

    // Phone number formatting
    document.getElementById('phone').addEventListener('input', function (e) {
        let value = this.value.replace(/\D/g, '');
        if (value.length > 0) {
            if (value.length <= 3) {
                this.value = `(${value}`;
            } else if (value.length <= 6) {
                this.value = `(${value.slice(0, 3)}) ${value.slice(3)}`;
            } else {
                this.value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 10)}`;
            }
        }
    });

    // Email validation function
    function validateEmail(email) {
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }

    // Phone validation function
    function validatePhone(phone) {
        const re = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
        return re.test(String(phone).replace(/\D/g, ''));
    }

    // Step validation functions
    function validateStep1() {
        const zipInput = document.getElementById('zip');
        const zipError = document.getElementById('error-zip');
        
        if (zipInput.value.match(/^\d{5}$/)) {
            zipError.style.display = 'none';
            zipInput.classList.remove('error');
            return true;
        } else {
            zipError.style.display = 'block';
            zipInput.classList.add('error');
            return false;
        }
    }

    function validateStep2() {
        const projectScope = document.querySelector('input[name="WindowsProjectScope"]:checked');
        
        if (!projectScope) {
            // You could add a visual indicator here if needed
            alert('Please select whether you need to replace or repair your windows.');
            return false;
        }
        return true;
    }

    function validateStep3() {
        const numberOfWindows = document.querySelector('input[name="NumberOfWindows"]:checked');
        
        if (!numberOfWindows) {
            // You could add a visual indicator here if needed
            alert('Please select how many windows you need work on.');
            return false;
        }
        return true;
    }

    function validateStep4() {
        const addressInput = document.getElementById('address');
        const addressError = document.getElementById('error-address');

        if (addressInput.value.trim().length >= 5) {
            addressError.style.display = 'none';
            addressInput.classList.remove('error');
            return true;
        } else {
            addressError.style.display = 'block';
            addressInput.classList.add('error');
            return false;
        }
    }

    function validateStep5() {
        const firstName = document.getElementById('firstName');
        const lastName = document.getElementById('lastName');
        const firstNameError = document.getElementById('error-firstName');
        const lastNameError = document.getElementById('error-lastName');

        // Hide all errors first
        firstNameError.style.display = 'none';
        lastNameError.style.display = 'none';
        firstName.classList.remove('error');
        lastName.classList.remove('error');

        let isValid = true;

        if (!firstName.value.trim() || firstName.value.trim().length < 2) {
            firstNameError.style.display = 'block';
            firstName.classList.add('error');
            isValid = false;
        }

        if (!lastName.value.trim() || lastName.value.trim().length < 2) {
            lastNameError.style.display = 'block';
            lastName.classList.add('error');
            isValid = false;
        }

        return isValid;
    }

    function validateStep6() {
        const firstName = document.getElementById('firstName');
        const lastName = document.getElementById('lastName');
        const email = document.getElementById('email');
        const phone = document.getElementById('phone');

        document.querySelectorAll('.form-group-error-message').forEach(error => {
            error.style.display = 'none';
        });

        // Remove error classes from all inputs
        [firstName, lastName, email, phone].forEach(input => {
            if (input) input.classList.remove('error');
        });

        let isValid = true;

        if (!firstName.value.trim() || firstName.value.trim().length < 2) {
            document.getElementById('error-firstName').style.display = 'block';
            firstName.classList.add('error');
            isValid = false;
        }

        if (!lastName.value.trim() || lastName.value.trim().length < 2) {
            document.getElementById('error-lastName').style.display = 'block';
            lastName.classList.add('error');
            isValid = false;
        }

        if (!validateEmail(email.value)) {
            document.getElementById('error-email').style.display = 'block';
            email.classList.add('error');
            isValid = false;
        }

        if (!validatePhone(phone.value)) {
            document.getElementById('error-phone').style.display = 'block';
            phone.classList.add('error');
            isValid = false;
        }

        return isValid;
    }

    // Make validation functions available globally
    window.validateStep1 = validateStep1;
    window.validateStep2 = validateStep2;
    window.validateStep3 = validateStep3;
    window.validateStep4 = validateStep4;
    window.validateStep5 = validateStep5;
    window.validateStep6 = validateStep6;
});

// Make showStep available globally
window.showStep = showStep;
