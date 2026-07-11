// State variables
let dolarBCV = 0;
let euroBCV = 0;
let usdtRate = 0;
let usdtBid = 0;
let usdtAsk = 0;
let countdownInterval = null;
let countdownTime = 60;
let ratesChart = null;

// DOM Elements
const statusBadge = document.getElementById('status-badge');
const statusText = document.getElementById('status-text');
const valDolarBCV = document.getElementById('val-dolar-bcv');
const dateDolarBCV = document.getElementById('date-dolar-bcv');
const valEuroBCV = document.getElementById('val-euro-bcv');
const dateEuroBCV = document.getElementById('date-euro-bcv');
const valUSDT = document.getElementById('val-usdt');
const valUSDTBid = document.getElementById('val-usdt-bid');
const valUSDTAsk = document.getElementById('val-usdt-ask');
const dateUSDT = document.getElementById('date-usdt');

const spreadDolarPct = document.getElementById('spread-dolar-pct');
const spreadDolarAbs = document.getElementById('spread-dolar-abs');
const spreadEuroPct = document.getElementById('spread-euro-pct');
const spreadEuroAbs = document.getElementById('spread-euro-abs');

const calcAmount = document.getElementById('calc-amount');
const calcCurrency = document.getElementById('calc-currency');
const calcResBCV = document.getElementById('calc-res-bcv');
const calcResEuro = document.getElementById('calc-res-euro');
const calcResUSDT = document.getElementById('calc-res-usdt');
const calcSavings = document.getElementById('calc-savings');

const refreshBtn = document.getElementById('refresh-btn');
const countdownSpan = document.getElementById('countdown');

// Formatters
const formatVES = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '--,--';
    return new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(value);
};

const formatPercent = (value) => {
    if (isNaN(value)) return '--%';
    const prefix = value > 0 ? '+' : '';
    return `${prefix}${value.toFixed(2)}%`;
};

// Fetch Rates from APIs
async function fetchRates() {
    updateStatus('loading', 'Actualizando cotizaciones...');
    
    try {
        // Fetch Dolar BCV, Euro BCV, and USDT Binance in parallel
        const [resDolar, resEuro, resUSDT] = await Promise.all([
            fetch('https://ve.dolarapi.com/v1/dolares/oficial').then(r => {
                if (!r.ok) throw new Error('Error al obtener Dólar BCV');
                return r.json();
            }),
            fetch('https://ve.dolarapi.com/v1/euros/oficial').then(r => {
                if (!r.ok) throw new Error('Error al obtener Euro BCV');
                return r.json();
            }),
            fetch('https://criptoya.com/api/binancep2p/usdt/ves').then(r => {
                if (!r.ok) throw new Error('Error al obtener USDT');
                return r.json();
            })
        ]);

        // Parse Dolar BCV
        dolarBCV = resDolar.promedio;
        const timeDolar = new Date(resDolar.fechaActualizacion);
        valDolarBCV.textContent = formatVES(dolarBCV);
        dateDolarBCV.innerHTML = `<i class="fa-regular fa-clock"></i> BCV: ${timeDolar.toLocaleDateString()} ${timeDolar.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;

        // Parse Euro BCV
        euroBCV = resEuro.promedio;
        const timeEuro = new Date(resEuro.fechaActualizacion);
        valEuroBCV.textContent = formatVES(euroBCV);
        dateEuroBCV.innerHTML = `<i class="fa-regular fa-clock"></i> BCV: ${timeEuro.toLocaleDateString()} ${timeEuro.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;

        // Parse USDT P2P (Binance)
        usdtBid = resUSDT.bid;
        usdtAsk = resUSDT.ask;
        usdtRate = (usdtBid + usdtAsk) / 2;
        valUSDT.textContent = formatVES(usdtRate);
        valUSDTBid.textContent = formatVES(usdtBid);
        valUSDTAsk.textContent = formatVES(usdtAsk);
        const timeUSDT = new Date(resUSDT.time * 1000);
        dateUSDT.innerHTML = `<i class="fa-regular fa-clock"></i> Binance P2P: ${timeUSDT.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;

        // Calculate Spreads
        calculateSpreads();

        // Update Chart
        updateChart();

        // Run Calculator
        runCalculator();

        updateStatus('success', 'Actualizado');
        resetCountdown();
    } catch (error) {
        console.error('Error fetching rates:', error);
        updateStatus('error', 'Error de conexión');
    }
}

// Calculate Differentials
function calculateSpreads() {
    // Dolar BCV vs USDT
    const diffDolarAbs = usdtRate - dolarBCV;
    const diffDolarPct = (diffDolarAbs / dolarBCV) * 100;
    spreadDolarPct.textContent = formatPercent(diffDolarPct);
    spreadDolarAbs.textContent = `${formatVES(diffDolarAbs)} VES de diferencia`;

    // Euro BCV vs USDT
    // Euro BCV to USD rate: euroBCV / dolarBCV
    // USDT represents USD. So we compare usdtRate (USD Cripto) vs euroBCV.
    const diffEuroAbs = usdtRate - euroBCV;
    const diffEuroPct = (diffEuroAbs / euroBCV) * 100;
    
    // Change color and text depending on spread sign
    spreadEuroPct.textContent = formatPercent(diffEuroPct);
    if (diffEuroAbs > 0) {
        spreadEuroPct.style.color = 'var(--accent-emerald)';
        spreadEuroAbs.textContent = `${formatVES(diffEuroAbs)} VES de diferencia (USDT arriba)`;
    } else {
        spreadEuroPct.style.color = 'var(--accent-gold)';
        spreadEuroAbs.textContent = `${formatVES(Math.abs(diffEuroAbs))} VES de diferencia (Euro arriba)`;
    }
}

// Update Status Badge
function updateStatus(type, message) {
    const indicator = statusBadge.querySelector('.indicator');
    
    indicator.className = 'indicator';
    statusBadge.className = 'status-badge';
    
    if (type === 'loading') {
        indicator.classList.add('pulse');
        statusText.textContent = message;
    } else if (type === 'success') {
        indicator.classList.add('success');
        statusText.textContent = message;
    } else if (type === 'error') {
        indicator.classList.add('error');
        statusText.textContent = message;
    }
}

// Chart.js Configuration & Update
function updateChart() {
    const ctx = document.getElementById('ratesChart').getContext('2d');
    
    const data = {
        labels: ['Dólar BCV', 'Euro BCV', 'USDT Binance'],
        datasets: [{
            label: 'Tasa en Bs. (VES)',
            data: [dolarBCV, euroBCV, usdtRate],
            backgroundColor: [
                'rgba(59, 130, 246, 0.25)',   // Blue
                'rgba(139, 92, 246, 0.25)',  // Purple
                'rgba(16, 185, 129, 0.25)'   // Emerald
            ],
            borderColor: [
                'rgba(59, 130, 246, 1)',
                'rgba(139, 92, 246, 1)',
                'rgba(16, 185, 129, 1)'
            ],
            borderWidth: 2,
            borderRadius: 10,
            borderSkipped: false,
        }]
    };

    const config = {
        type: 'bar',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return ` Bs. ${formatVES(context.raw)}`;
                        }
                    },
                    backgroundColor: '#0c101f',
                    titleFont: { family: 'Outfit', size: 13, weight: 'bold' },
                    bodyFont: { family: 'Outfit', size: 14 },
                    borderColor: 'rgba(255,255,255,0.08)',
                    borderWidth: 1
                }
            },
            scales: {
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: '#94a3b8',
                        font: { family: 'Outfit' }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#f8fafc',
                        font: { family: 'Outfit', weight: 'bold' }
                    }
                }
            }
        }
    };

    if (ratesChart) {
        ratesChart.destroy();
    }
    
    ratesChart = new Chart(ctx, config);
}

// Converter Calculator Logic
function runCalculator() {
    const amount = parseFloat(calcAmount.value);
    const currency = calcCurrency.value;
    
    if (isNaN(amount) || amount <= 0) {
        calcResBCV.textContent = 'Bs. 0,00';
        calcResEuro.textContent = 'Bs. 0,00';
        calcResUSDT.textContent = 'Bs. 0,00';
        calcSavings.innerHTML = 'Ingrese un monto válido para calcular.';
        return;
    }

    let bcvResult, euroResult, usdtResult;
    let detailsText = '';

    if (currency === 'VES') {
        // Converting VES to foreign currencies
        bcvResult = amount / dolarBCV;
        euroResult = amount / euroBCV;
        usdtResult = amount / usdtRate;
        
        calcResBCV.textContent = `$ ${formatVES(bcvResult)}`;
        calcResEuro.textContent = `€ ${formatVES(euroResult)}`;
        calcResUSDT.textContent = `${formatVES(usdtResult)} USDT`;
        
        // Insight
        const diffDolarPct = ((usdtRate - dolarBCV) / dolarBCV) * 100;
        detailsText = `Con Bs. ${formatVES(amount)} obtienes <strong>${formatVES(bcvResult)} USD</strong> a tasa oficial BCV, pero en el mercado cripto obtendrías <strong>${formatVES(usdtResult)} USDT</strong>. El dólar oficial te rinde un <strong>${diffDolarPct.toFixed(2)}% más</strong> en cantidad de divisas por tus Bolívares.`;
    } else {
        // Converting foreign currencies to VES
        if (currency === 'USD') {
            bcvResult = amount * dolarBCV;
            euroResult = amount * (dolarBCV / euroBCV) * euroBCV; // cross rate
            usdtResult = amount * usdtRate;
            
            const diffVES = usdtResult - bcvResult;
            const diffPct = (diffVES / bcvResult) * 100;
            detailsText = `Al cambiar $${formatVES(amount)} USD, obtienes <strong>Bs. ${formatVES(usdtResult)}</strong> en USDT (P2P) y <strong>Bs. ${formatVES(bcvResult)}</strong> a tasa Dólar BCV. ¡Obtienes <strong>Bs. ${formatVES(diffVES)} más</strong> (+${diffPct.toFixed(2)}%) usando USDT!`;
        } else if (currency === 'EUR') {
            bcvResult = amount * (euroBCV / dolarBCV) * dolarBCV; // cross rate
            euroResult = amount * euroBCV;
            usdtResult = (amount * euroBCV) / usdtRate * usdtRate; // raw value
            
            // For Euro, we can convert to VES directly
            bcvResult = (amount * euroBCV / dolarBCV) * dolarBCV; // Actually, the VES value of EUR is just amount * euroBCV
            bcvResult = amount * euroBCV; // wait, Euro BCV is already EUR/VES
            usdtResult = (amount * euroBCV) / usdtRate * usdtRate; 
            
            // Let's show VES outcomes
            const vesFromEurBCV = amount * euroBCV;
            const usdEquivalent = (amount * euroBCV) / dolarBCV;
            const vesFromUSDT = usdEquivalent * usdtRate;
            
            bcvResult = vesFromEurBCV; // EUR to VES via BCV
            euroResult = vesFromEurBCV; // EUR to VES
            usdtResult = vesFromUSDT; // EUR to USD then USD to VES via USDT
            
            const diffVES = usdtResult - bcvResult;
            const diffPct = (diffVES / bcvResult) * 100;
            
            if (diffVES > 0) {
                detailsText = `Cambiando €${formatVES(amount)} EUR obtenida a tasa oficial da Bs. ${formatVES(bcvResult)}. Si conviertes a USD y vendes en USDT P2P obtienes <strong>Bs. ${formatVES(usdtResult)}</strong> (Diferencia de <strong>Bs. ${formatVES(diffVES)}</strong> a favor, +${diffPct.toFixed(2)}%).`;
            } else {
                detailsText = `Cambiando €${formatVES(amount)} EUR a tasa oficial obtienes <strong>Bs. ${formatVES(bcvResult)}</strong>. Con USDT P2P obtendrías Bs. ${formatVES(usdtResult)}. El Euro Oficial te da <strong>Bs. ${formatVES(Math.abs(diffVES))} más</strong> que el mercado USDT P2P.`;
            }
        } else if (currency === 'USDT') {
            bcvResult = amount * dolarBCV;
            euroResult = (amount * usdtRate) / euroBCV * euroBCV; // just showing VES equivalent
            usdtResult = amount * usdtRate;
            
            const diffVES = usdtResult - bcvResult;
            const diffPct = (diffVES / bcvResult) * 100;
            detailsText = `Por ${formatVES(amount)} USDT obtienes <strong>Bs. ${formatVES(usdtResult)}</strong> en P2P, comparado con <strong>Bs. ${formatVES(bcvResult)}</strong> si se calculara a tasa oficial Dólar BCV. La brecha es de <strong>Bs. ${formatVES(diffVES)}</strong> (+${diffPct.toFixed(2)}%).`;
        }
        
        calcResBCV.textContent = `Bs. ${formatVES(bcvResult)}`;
        calcResEuro.textContent = `Bs. ${formatVES(euroResult)}`;
        calcResUSDT.textContent = `Bs. ${formatVES(usdtResult)}`;
    }

    calcSavings.innerHTML = detailsText;
}

// Countdown refresh timer
function startCountdown() {
    clearInterval(countdownInterval);
    countdownTime = 60;
    countdownSpan.textContent = countdownTime;
    
    countdownInterval = setInterval(() => {
        countdownTime--;
        countdownSpan.textContent = countdownTime;
        
        if (countdownTime <= 0) {
            fetchRates();
        }
    }, 1000);
}

function resetCountdown() {
    startCountdown();
}

// Event Listeners
refreshBtn.addEventListener('click', () => {
    fetchRates();
});

calcAmount.addEventListener('input', runCalculator);
calcCurrency.addEventListener('change', () => {
    // Update labels in result list based on input currency
    const labels = document.querySelectorAll('.results-grid .rate-name');
    const currency = calcCurrency.value;
    
    if (currency === 'VES') {
        document.querySelector('.calc-results h3').textContent = 'Resultados en Divisas';
        document.getElementById('result-bcv').querySelector('.rate-name').innerHTML = '<i class="fa-solid fa-building-columns"></i> Dólar BCV (USD)';
        document.getElementById('result-euro').querySelector('.rate-name').innerHTML = '<i class="fa-solid fa-euro-sign"></i> Euro BCV (EUR)';
        document.getElementById('result-usdt').querySelector('.rate-name').innerHTML = '<i class="fa-solid fa-dollar-sign"></i> USDT P2P (USDT)';
    } else {
        document.querySelector('.calc-results h3').textContent = 'Resultados en Bolívares (VES)';
        document.getElementById('result-bcv').querySelector('.rate-name').innerHTML = '<i class="fa-solid fa-building-columns"></i> Dólar BCV';
        document.getElementById('result-euro').querySelector('.rate-name').innerHTML = '<i class="fa-solid fa-euro-sign"></i> Euro BCV';
        document.getElementById('result-usdt').querySelector('.rate-name').innerHTML = '<i class="fa-solid fa-dollar-sign"></i> USDT P2P';
    }
    runCalculator();
});

// Initial load
fetchRates();
