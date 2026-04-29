// Update slider display values
const sliders = ['riders', 'drivers', 'duration', 'traffic'];

sliders.forEach(id => {
    const slider = document.getElementById(id);
    slider.addEventListener('input', function() {
        document.getElementById(id + 'Value').textContent = this.value;
    });
});

function predictPrice() {
    const formData = {
        riders: document.getElementById('riders').value,
        drivers: document.getElementById('drivers').value,
        duration: document.getElementById('duration').value,
        vehicle: document.getElementById('vehicle').value,
        is_peak: document.getElementById('is_peak').value,
        traffic: document.getElementById('traffic').value
    };

    const errorMsg = document.getElementById('errorMessage');
    errorMsg.classList.remove('show');

    fetch('/api/predict', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            errorMsg.textContent = '❌ Error: ' + data.error;
            errorMsg.classList.add('show');
        } else {
            document.getElementById('basePrice').textContent = '₹' + data.base_price.toFixed(2);
            document.getElementById('finalPrice').textContent = '₹' + data.price.toFixed(2);
            document.getElementById('ratio').textContent = data.ratio.toFixed(2) + 'x';
        }
    })
    .catch(error => {
        errorMsg.textContent = '❌ Error: ' + error;
        errorMsg.classList.add('show');
    });
}

// Calculate on page load
document.addEventListener('DOMContentLoaded', function() {
    predictPrice();
});
