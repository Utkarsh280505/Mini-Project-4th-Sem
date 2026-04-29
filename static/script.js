// Animate number function for smooth counting
function animateValue(obj, start, end, duration, prefix = '', suffix = '') {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        
        // Use easeOutQuart for smooth deceleration
        const easeProgress = 1 - Math.pow(1 - progress, 4);
        const current = start + easeProgress * (end - start);
        
        // Format based on whether it's an integer or float
        const formatted = end % 1 !== 0 ? current.toFixed(2) : Math.floor(current);
        obj.textContent = prefix + formatted + suffix;
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            obj.textContent = prefix + (end % 1 !== 0 ? end.toFixed(2) : end) + suffix;
        }
    };
    window.requestAnimationFrame(step);
}

// Update slider display values and track fill
const sliders = ['riders', 'drivers', 'duration', 'hour', 'traffic'];

sliders.forEach(id => {
    const slider = document.getElementById(id);
    if (slider) {
        // Initialize fill
        updateSliderFill(slider);
        
        slider.addEventListener('input', function () {
            document.getElementById(id + 'Value').textContent = this.value;
            updateSliderFill(this);
        });
    }
});

function updateSliderFill(slider) {
    const percentage = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
    slider.style.background = `linear-gradient(to right, #2dd4bf 0%, #6366f1 ${percentage}%, rgba(255, 255, 255, 0.1) ${percentage}%, rgba(255, 255, 255, 0.1) 100%)`;
}

function calculatePrice() {
    const hour = parseInt(document.getElementById('hour').value);
    const is_peak = (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20) ? 1 : 0;

    const formData = {
        riders: document.getElementById('riders').value,
        drivers: document.getElementById('drivers').value,
        duration: document.getElementById('duration').value,
        vehicle: document.getElementById('vehicle').value,
        is_peak: is_peak,
        traffic: document.getElementById('traffic').value
    };

    const btn = document.querySelector('.btn-glow') || document.querySelector('.btn-calculate');
    if (btn) {
        btn.innerHTML = '<span class="btn-content">⚡ Calculating...</span>';
        btn.style.opacity = '0.8';
    }

    fetch('/api/predict', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
    })
        .then(response => response.json())
        .then(data => {
            if (btn) {
                btn.innerHTML = '<span class="btn-content">⚡ Calculate Price</span>';
                btn.style.opacity = '1';
            }
            
            if (data.error) {
                alert('Error: ' + data.error);
            } else {
                // Show the results panel if hidden
                const panel = document.getElementById('resultsPanel');
                if (panel.style.display === 'none') {
                    panel.style.display = 'block';
                }

                // Get current values to animate from
                const priceEl = document.getElementById('priceValue');
                const baseEl = document.getElementById('baseValue');
                const ratioEl = document.getElementById('ratioValue');
                
                const currPrice = parseFloat(priceEl.textContent.replace(/[^0-9.]/g, '')) || 0;
                const currBase = parseFloat(baseEl.textContent.replace(/[^0-9.]/g, '')) || 0;
                const currRatio = parseFloat(ratioEl.textContent.replace(/[^0-9.]/g, '')) || 0;

                // Animate to new values
                animateValue(priceEl, currPrice, data.price, 1000, '₹');
                animateValue(baseEl, currBase, data.base_price, 800, '₹');
                animateValue(ratioEl, currRatio, data.ratio, 800, '', 'x');
                
                document.getElementById('trafficMetric').textContent = formData.traffic;
                
                // Populate Smart Insights
                const demandText = data.ratio > 1 
                    ? `High Demand: There are ${formData.riders} riders competing for ${formData.drivers} drivers.` 
                    : `Low Demand: Drivers outnumber riders.`;
                document.getElementById('demandInsight').textContent = demandText;
                
                const vehicleText = formData.vehicle === "1" 
                    ? `Premium Vehicle selected (+15% fare increase applied).` 
                    : `Economy Vehicle selected (Standard fare).`;
                document.getElementById('vehicleInsight').textContent = vehicleText;
                
                const surgeText = data.ratio > 2 
                    ? `High Surge Multiplier (1.2x) is active due to extreme demand.` 
                    : data.ratio < 0.8 
                        ? `Discount Multiplier (0.9x) is active to stimulate demand.` 
                        : `Standard pricing without significant demand multipliers.`;
                document.getElementById('surgeInsight').innerHTML = surgeText + (formData.is_peak ? `<br><br><span style="color: #f87171;">Peak Hours Surcharge (+10%) also applied.</span>` : ``);
                
                // Draw Plotly Graph
                if (typeof Plotly !== 'undefined') {
                    const plotData = [{
                        x: ['Base Price', 'Optimized Fare'],
                        y: [data.base_price, data.price],
                        type: 'bar',
                        marker: {
                            color: ['#94a3b8', '#a855f7'],
                            line: {
                                color: ['#64748b', '#7e22ce'],
                                width: 1.5
                            }
                        }
                    }];
                    
                    const layout = {
                        title: 'Fare Comparison',
                        paper_bgcolor: 'rgba(0,0,0,0)',
                        plot_bgcolor: 'rgba(0,0,0,0)',
                        font: {
                            family: 'Outfit, sans-serif',
                            color: '#f8fafc'
                        },
                        yaxis: {
                            title: 'Price (₹)',
                            gridcolor: 'rgba(255,255,255,0.1)'
                        },
                        margin: { t: 40, b: 30, l: 50, r: 20 }
                    };
                    
                    Plotly.newPlot('priceChart', plotData, layout, {displayModeBar: false});
                }
            }
        })
        .catch(error => {
            if (btn) {
                btn.innerHTML = '<span class="btn-content">⚡ Calculate Price</span>';
                btn.style.opacity = '1';
            }
            alert('Error: ' + error);
        });
}

// Calculate on page load if dashboard is visible
document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('riders')) {
        calculatePrice();
    }
});
