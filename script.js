function showStep(stepNumber) {
    const steps = document.querySelectorAll('.step');
    const progressDots = document.querySelectorAll('.progress-dot');
    const progressLines = document.querySelectorAll('.progress-line');

    steps.forEach(step => step.classList.remove('active'));

    const currentStep = document.querySelector(`.step[data-step="${stepNumber}"]`);
    if (currentStep) currentStep.classList.add('active');

    updateProgress(stepNumber);
    updateHeaderBackArrow(stepNumber);
}

function updateProgress(currentStep) {
    const progressDots = document.querySelectorAll('.progress-dot');
    const progressLines = document.querySelectorAll('.progress-line');

    progressDots.forEach((dot, index) => {
        dot.classList.toggle('active', index + 1 <= currentStep);
    });

    progressLines.forEach((line, index) => {
        line.classList.toggle('active', index < currentStep - 1);
    });
}

function updateHeaderBackArrow(currentStep) {
    const headerBackArrow = document.getElementById('header-back-arrow');
    if (headerBackArrow) {
        headerBackArrow.style.display = currentStep > 1 ? 'block' : 'none';
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('windows-quote-form');
    const headerBackArrow = document.getElementById('header-back-arrow');
    
    // Header back arrow functionality
    if (headerBackArrow) {
        headerBackArrow.addEventListener('click', function() {
            const currentStep = document.querySelector('.step.active');
            if (currentStep) {
                const currentStepNumber = parseInt(currentStep.dataset.step);
                if (currentStepNumber > 1) {
                    showStep(currentStepNumber - 1);
                }
            }
        });
    }
    
    // Initialize
    showStep(1);
    document.querySelectorAll('.form-group-error-message').forEach(error => {
        error.style.display = 'none';
    });

    // Step 1: ZIP Code validation
    document.getElementById('step1-button').addEventListener('click', function () {
        const zipInput = document.getElementById('zip');
        const zipError = document.getElementById('error-zip');

        document.activeElement.blur();
        
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    
        this.querySelector('.btn-spinner').style.display = 'inline-block';
    
        setTimeout(() => {
            if (zipInput.value.match(/^\d{5}$/)) {
                zipError.style.display = 'none';
                showStep(2);
            } else {
                zipError.style.display = 'block';
            }
    
            this.querySelector('.btn-spinner').style.display = 'none';
        }, 800);
    });

    // ZIP code input formatting
    document.getElementById('zip').addEventListener('input', function (e) {
        this.value = this.value.replace(/[^0-9]/g, '');
    });

    // Step 2: Visual option cards (Replace/Repair)
    const visualOptionCards = document.querySelectorAll('.visual-option-card');
    visualOptionCards.forEach(card => {
        card.addEventListener('click', function () {
            const radio = this.querySelector('input[type="radio"]');
            if (radio) {
                radio.checked = true;
                
                // Auto-advance after selection
                setTimeout(() => {
                    showStep(3);
                }, 500);
            }
        });
    });

    // Step 3: Number options
    const numberOptions = document.querySelectorAll('.number-option');
    numberOptions.forEach(option => {
        option.addEventListener('click', function () {
            const radio = this.querySelector('input[type="radio"]');
            if (radio) {
                radio.checked = true;
                
                // Auto-advance after selection
                setTimeout(() => {
                    showStep(4);
                }, 500);
            }
        });
    });

    // Step 4: Address validation
    const step4Button = document.getElementById('step4-button');
    if (step4Button) {
        step4Button.addEventListener('click', function () {
            const addressInput = document.getElementById('address');
            const addressError = document.getElementById('error-address');

            this.querySelector('.btn-spinner').style.display = 'inline-block';

            setTimeout(() => {
                if (addressInput.value.trim()) {
                    addressError.style.display = 'none';
                    showStep(5);
                } else {
                    addressError.style.display = 'block';
                }

                this.querySelector('.btn-spinner').style.display = 'none';
            }, 300);
        });
    }

    // Step 5: Name validation
    const step5Button = document.getElementById('step5-button');
    if (step5Button) {
        step5Button.addEventListener('click', function () {
            const firstName = document.getElementById('firstName');
            const lastName = document.getElementById('lastName');
            const firstNameError = document.getElementById('error-firstName');
            const lastNameError = document.getElementById('error-lastName');

            // Hide all errors first
            firstNameError.style.display = 'none';
            lastNameError.style.display = 'none';

            let isValid = true;

            if (!firstName.value.trim()) {
                firstNameError.style.display = 'block';
                isValid = false;
            }

            if (!lastName.value.trim()) {
                lastNameError.style.display = 'block';
                isValid = false;
            }

            if (isValid) {
                this.querySelector('.btn-spinner').style.display = 'inline-block';

                setTimeout(() => {
                    showStep(6);
                    this.querySelector('.btn-spinner').style.display = 'none';
                }, 300);
            }
        });
    }

    // Final form submission
    document.getElementById('submit-form').addEventListener('click', function (e) {
        e.preventDefault();

        const firstName = document.getElementById('firstName');
        const lastName = document.getElementById('lastName');
        const email = document.getElementById('email');
        const phone = document.getElementById('phone');

        document.querySelectorAll('.form-group-error-message').forEach(error => {
            error.style.display = 'none';
        });

        let isValid = true;

        if (!firstName.value.trim()) {
            document.getElementById('error-firstName').style.display = 'block';
            isValid = false;
        }

        if (!lastName.value.trim()) {
            document.getElementById('error-lastName').style.display = 'block';
            isValid = false;
        }

        if (!validateEmail(email.value)) {
            document.getElementById('error-email').style.display = 'block';
            isValid = false;
        }

        if (!validatePhone(phone.value)) {
            document.getElementById('error-phone').style.display = 'block';
            isValid = false;
        }

        if (!isValid) {
            return;
        }

        this.querySelector('.btn-spinner').style.display = 'inline-block';
        this.disabled = true;

        const formData = {
            zip: document.getElementById('zip').value,
            projectScope: document.querySelector('input[name="WindowsProjectScope"]:checked')?.value,
            numberOfWindows: document.querySelector('input[name="NumberOfWindows"]:checked')?.value,
            address: document.getElementById('address').value,
            propertyOwner: document.getElementById('propertyOwner').checked,
            firstName: firstName.value,
            lastName: lastName.value,
            email: email.value,
            phone: phone.value
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
                this.disabled = false;
                this.querySelector('.btn-spinner').style.display = 'none';
            });
    });

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
});

// Make showStep available globally
window.showStep = showStep;
