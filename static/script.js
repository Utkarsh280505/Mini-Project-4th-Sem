// Update slider values in real-time
document.getElementById('riders').addEventListener('input', function() {
    document.getElementById('ridersValue').textContent = this.value;
});
document.getElementById('drivers').addEventListener('input', function() {
    document.getElementById('driversValue').textContent = this.value;
});
document.getElementById('duration').addEventListener('input', function() {
    document.getElementById('durationValue').textContent = this.value;
});
document.getElementById('hour').addEventListener('input', function() {
    document.getElementById('hourValue').textContent = this.value;
});
document.getElementById('traffic').addEventListener('input', function() {
    document.getElementById('trafficValue').textContent = this.value;
});

async function calculatePrice() {
    const riders = parseInt(document.getElementById('riders').value);
    const drivers = parseInt(document.getElementById('drivers').value);
    const duration = parseInt(document.getElementById('duration').value);
    const vehicle = parseInt(document.getElementById('vehicle').value);
    const hour = parseInt(document.getElementById('hour').value);
    const traffic = parseInt(document.getElementById('traffic').value);
    
    const is_peak = (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20) ? 1 : 0;
    
    try {
        const response = await fetch('/api/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                riders, drivers, duration, vehicle, is_peak, traffic
            })
        });
        
        const data = await response.json();
        
        if (data.error) {
            alert('Error: ' + data.error);
            return;
        }
        
        const price = data.price;
        const basePrice = data.base_price;
        const ratio = data.ratio;
        
        // Show results
        document.getElementById('emptyState').style.display = 'none';
        document.getElementById('resultsPanel').style.display = 'block';
        
        // Update metrics
        document.getElementById('priceValue').textContent = '₹' + price.toFixed(2);
        document.getElementById('baseValue').textContent = '₹' + basePrice.toFixed(2);
        document.getElementById('ratioValue').textContent = ratio.toFixed(2) + 'x';
        document.getElementById('trafficMetricValue').textContent = traffic;
        
        // Determine demand label
        let demandLabel, demandEmoji;
        if (ratio >= 2.5) {
            demandLabel = '🔴 Very High Demand';
        } else if (ratio >= 1.5) {
            demandLabel = '🟠 High Demand';
        } else if (ratio >= 1.0) {
            demandLabel = '🟡 Moderate Demand';
        } else {
            demandLabel = '🟢 Low Demand';
        }
        
        // Update insights
        document.getElementById('demandInsight').innerHTML = `
            <p><strong>${demandLabel}</strong></p>
            <p>Demand-supply ratio is <b>${ratio.toFixed(2)}x</b>.</p>
            <p>${ratio > 1.5 ? 'Prices surge during high demand.' : 'Supply meets demand. Stable pricing.'}</p>
        `;
        
        document.getElementById('vehicleInsight').innerHTML = `
            <p><strong>🏎️ ${vehicle === 0 ? 'Economy' : 'Premium'} Mode</strong></p>
            <p>${vehicle === 0 ? 'Economy mode offers budget-friendly rides with lower base pricing.' : 'Premium vehicles attract higher base fares and surge multipliers.'}</p>
        `;
        
        const surgePct = Math.max(0, (ratio - 1) * 100).toFixed(1);
        document.getElementById('surgeInsight').innerHTML = `
            <p><strong>⚡ Surge Factor</strong></p>
            <p>Estimated surge above base: <b>+${surgePct}%</b></p>
            <p>Optimal booking: ${ratio < 1.5 ? 'Now or later' : 'Wait for supply to balance'}</p>
        `;
        
        // Generate charts
        generateCharts(riders, drivers, duration, vehicle, is_peak, traffic);
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error calculating price');
    }
}

function generateCharts(riders, drivers, duration, vehicle, is_peak, traffic) {
    // Fare vs. Riders Chart
    const riderRanges = Array.from({length: 20}, (_, i) => (i + 1) * 5);
    const driverRanges = Array.from({length: 17}, (_, i) => (i + 1) * 3);
    const durationRanges = Array.from({length: 8}, (_, i) => (i + 1) * 15);
    
    // Line chart - Fare vs Riders
    const lineTrace = {
        x: riderRanges,
        y: riderRanges.map(r => calculateFareEstimate(r, drivers, duration, vehicle, is_peak, traffic)),
        mode: 'lines+markers',
        name: 'Predicted Fare',
        line: {color: '#a78bfa', width: 3},
        marker: {size: 6, color: '#a78bfa'}
    };
    
    const lineLayout = {
        title: '📉 Fare vs. Rider Demand',
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(255,255,255,0.03)',
        font: {color: '#cbd5e1'},
        xaxis: {title: 'Riders', gridcolor: 'rgba(255,255,255,0.06)'},
        yaxis: {title: 'Fare (₹)', gridcolor: 'rgba(255,255,255,0.06)'},
        margin: {l: 60, r: 20, t: 40, b: 40}
    };
    
    Plotly.newPlot('fareDemandChart', [lineTrace], lineLayout, {responsive: true});
    
    // Area chart - Fare vs Supply
    const areaTrace = {
        x: driverRanges,
        y: driverRanges.map(d => calculateFareEstimate(riders, d, duration, vehicle, is_peak, traffic)),
        fill: 'tozeroy',
        name: 'Predicted Fare',
        line: {color: '#60a5fa', width: 2},
        fillcolor: 'rgba(96,165,250,0.3)'
    };
    
    const areaLayout = {
        title: '🚗 Fare vs. Driver Supply',
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(255,255,255,0.03)',
        font: {color: '#cbd5e1'},
        xaxis: {title: 'Drivers', gridcolor: 'rgba(255,255,255,0.06)'},
        yaxis: {title: 'Fare (₹)', gridcolor: 'rgba(255,255,255,0.06)'},
        margin: {l: 60, r: 20, t: 40, b: 40}
    };
    
    Plotly.newPlot('fareSupplyChart', [areaTrace], areaLayout, {responsive: true});
    
    // Heatmap - Riders × Duration
    const heatmapData = [];
    const riderVals = [5, 15, 25, 35, 45, 55, 65, 75, 85, 95];
    const durationVals = [5, 20, 35, 50, 65, 80, 95, 110];
    
    for (let r of riderVals) {
        let row = [];
        for (let d of durationVals) {
            row.push(calculateFareEstimate(r, drivers, d, vehicle, is_peak, traffic));
        }
        heatmapData.push(row);
    }
    
    const heatmapTrace = {
        z: heatmapData,
        x: durationVals.map(d => d + 'm'),
        y: riderVals.map(r => r + ' riders'),
        type: 'heatmap',
        colorscale: 'Purples',
        colorbar: {title: 'Fare ₹', tickfont: {color: '#cbd5e1'}, titlefont: {color: '#cbd5e1'}}
    };
    
    const heatmapLayout = {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: {color: '#cbd5e1'},
        xaxis: {title: 'Duration'},
        yaxis: {title: 'Riders'},
        margin: {l: 80, r: 100, t: 40, b: 60}
    };
    
    Plotly.newPlot('fareHeatmap', [heatmapTrace], heatmapLayout, {responsive: true});
}

function calculateFareEstimate(r, d, dur, v, peak, traffic) {
    // Base calculation - simplified estimation
    let fare = dur * 8;
    
    // Demand multiplier
    const ratio = r / Math.max(d, 1);
    if (ratio > 2) {
        fare *= 1.2;
    } else if (ratio < 0.8) {
        fare *= 0.9;
    }
    
    // Peak multiplier
    if (peak) {
        fare *= 1.1;
    }
    
    // Traffic multiplier
    fare *= (1 + traffic * 0.05);
    
    // Premium vehicle
    if (v === 1) {
        fare *= 1.15;
    }
    
    return Math.round(fare);
}