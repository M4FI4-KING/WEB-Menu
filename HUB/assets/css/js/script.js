       // Central Command Hub - JavaScript File
        
        // --- DATA STRUCTURE: Only Daily Forecasts ---
        const LOCATION_NAME = "UDAWELA, TEL. / KANDY";
        
        const dailyForecasts = [
            // [0] CURRENT WEATHER (Default)
            { day: "CURRENT", temp: 27, condition: "Scattered Showers", icon: "🌧️", nextDay: "FRI" },
            // [1] DAY 1: FRI - Forecast
            { day: "FRI", temp: 29, condition: "Showers", icon: "☔", details: "High: 31°C | Low: 22°C" },
            // [2] DAY 2: SAT - Forecast
            { day: "SAT", temp: 28, condition: "Rain Intermittent", icon: "🌦️", details: "High: 30°C | Low: 21°C" },
            // [3] DAY 3: SUN - Forecast
            { day: "SUN", temp: 31, condition: "Mostly Sunny", icon: "☀️", details: "High: 33°C | Low: 23°C" },
            // [4] DAY 4: MON - Forecast
            { day: "MON", temp: 27, condition: "Thunderstorm Risk", icon: "⛈️", details: "High: 29°C | Low: 20°C" },
            // [5] DAY 5: TUE - Forecast
            { day: "TUE", temp: 26, condition: "Overcast", icon: "☁️", details: "High: 28°C | Low: 19°C" }
        ];

        // --- STATE VARIABLES ---
        let currentDayIndex = 0;
        const totalDays = dailyForecasts.length;

        // --- DOM REFERENCES ---
        const weatherLocationEl = document.getElementById('weather-location');
        const widgetMainInfoEl = document.getElementById('widget-main-info');
        const widgetDetailInfoEl = document.getElementById('widget-detail-info');
        const modalOverlay = document.getElementById('hourly-modal-overlay');
        const modalTitle = document.getElementById('modal-title');
        const hourlyDataContainer = document.getElementById('hourly-data-container');

        // --- INITIALIZATION ---
        document.addEventListener('DOMContentLoaded', () => {
            // Set the static location text
            weatherLocationEl.textContent = LOCATION_NAME;
            // Render the initial 'current' state
            renderWidgetState();
        });

        // --- RENDERING FUNCTION ---

        /**
         * Renders the current state (Current or Daily Forecast) to the widget.
         */
        function renderWidgetState() {
            const data = dailyForecasts[currentDayIndex];
            
            let mainText, detailText;

            if (data.day === 'CURRENT') {
                // Current Weather: 27°C 🌧️
                mainText = `${data.temp}°C ${data.icon}`;
                detailText = `STATUS: ${data.condition.toUpperCase()} | Click for ${data.nextDay} Forecast`;
                weatherLocationEl.textContent = LOCATION_NAME;
                weatherLocationEl.style.color = 'var(--neon-orange)';

            } else {
                // Forecast Day: 29°C ☔
                mainText = `${data.temp}°C ${data.icon}`;
                // Detail: High: 31°C | Low: 22°C
                detailText = `${data.details} | CLICK FOR HOURLY SCAN`;
                weatherLocationEl.textContent = `// ${data.day} FORECAST //`;
                weatherLocationEl.style.color = 'var(--neon-blue)';
            }

            widgetMainInfoEl.innerHTML = mainText; // Use innerHTML for emoji rendering
            widgetDetailInfoEl.textContent = detailText;
        }
        
        /**
         * Generates and displays the simulated hourly data in the modal.
         */
        function openHourlyModal(day) {
            modalTitle.textContent = `${day} HOURLY SCAN // 30-MINUTE INTERVALS`;
            hourlyDataContainer.innerHTML = ''; // Clear previous data
            
            // Simulated Data Logic (00:00 to 23:30, 30 min intervals)
            const conditions = [
                { cond: "Clear Sky", icon: "☀️", temp: 30 },
                { cond: "Light Cloud", icon: "🌤️", temp: 31 },
                { cond: "Overcast", icon: "☁️", temp: 29 },
                { cond: "Showers", icon: "☔", temp: 27 },
                { cond: "Thunder", icon: "⛈️", temp: 26 },
            ];

            // START at 00:00 and END at 23:00 (to include 23:30)
            const startIndex = 0; 
            const endIndex = 23;  

            for (let h = startIndex; h <= endIndex; h++) {
                for (let m = 0; m < 60; m += 30) {
                    const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                    
                    // Simple logic to cycle conditions throughout the day
                    const conditionIndex = Math.floor((h * 60 + m) / 90) % conditions.length;
                    const data = conditions[conditionIndex];

                    const entry = document.createElement('div');
                    entry.classList.add('time-entry');
                    entry.innerHTML = `
                        <span class="time">${time} HRS</span>
                        <span class="condition">${data.cond.toUpperCase()}</span>
                        <span class="icon">${data.icon}</span>
                    `;
                    hourlyDataContainer.appendChild(entry);
                }
            }

            modalOverlay.style.display = 'flex';
        }
        
        /**
         * Closes the modal and advances the main forecast to the next day.
         */
        function closeHourlyModal() {
            modalOverlay.style.display = 'none';
            // After closing the detail, we advance to the NEXT day's forecast
            
            // Advance index before rendering
            // Cycles from 1 -> 2 -> 3 -> 4 -> 5, then wraps back to 0 (CURRENT)
            if (currentDayIndex < totalDays - 1) {
                 currentDayIndex++;
            } else {
                currentDayIndex = 0;
            }
            
            renderWidgetState();
        }

        // --- INTERACTION LOGIC (Single Click Handler) ---

        /**
         * Main click handler for the weather widget.
         */
        function handleClick() {
            const data = dailyForecasts[currentDayIndex];

            if (data.day === 'CURRENT') {
                // If currently showing CURRENT, advance to FRI forecast (index 1)
                currentDayIndex = 1;
                renderWidgetState();
                
            } else {
                // If currently showing a forecast day (FRI, SAT, etc.), open the hourly modal for that day
                openHourlyModal(data.day);
                // Note: The index is NOT advanced here. The index advances when the modal is closed.
            }
        }
        
