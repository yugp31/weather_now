// weather.js

class WeatherApp {
    constructor() {
        this.cityInput = document.getElementById('cityInput');
        this.weatherCard = document.querySelector('.weather-card');
        this.errorMessage = document.querySelector('.error-message');
        this.loading = document.querySelector('.loading');
        this.saveLocationBtn = document.getElementById('saveLocation');
        this.clearLocationBtn = document.getElementById('clearLocation');
        this.debounceTimer = null;

        this.initializeApp();
    }

    initializeApp() {
        // Hide weather card initially
        this.weatherCard.style.display = 'none';
        
        // Check for saved location on startup
        const savedCity = this.getSavedCity();
        if (savedCity) {
            this.cityInput.value = savedCity;
            this.getWeather(savedCity);
            this.updateSaveButton(true);
        }

        // Event Listeners
        this.cityInput.addEventListener('input', (e) => this.handleInput(e));
        this.cityInput.addEventListener('keypress', (e) => this.handleKeyPress(e));
        this.saveLocationBtn.addEventListener('click', () => this.handleSaveLocation());
        this.clearLocationBtn.addEventListener('click', () => this.handleClearLocation());
    }

    handleInput(e) {
        clearTimeout(this.debounceTimer);
        const city = e.target.value.trim();
        
        if (city.length < 2) {
            this.weatherCard.style.display = 'none';
            this.errorMessage.style.display = 'none';
            return;
        }

        this.debounceTimer = setTimeout(() => {
            this.getWeather(city);
        }, 500);
    }

    handleKeyPress(e) {
        if (e.key === 'Enter') {
            const city = e.target.value.trim();
            if (city) {
                clearTimeout(this.debounceTimer);
                this.getWeather(city);
            }
        }
    }

    handleSaveLocation() {
        const currentCity = this.cityInput.value.trim();
        if (currentCity) {
            localStorage.setItem('savedCity', currentCity);
            this.showToast('Location saved successfully!');
            this.updateSaveButton(true);
        }
    }

    handleClearLocation() {
        localStorage.removeItem('savedCity');
        this.showToast('Saved location cleared');
        this.updateSaveButton(false);
    }

    getSavedCity() {
        return localStorage.getItem('savedCity');
    }

    updateSaveButton(isSaved) {
        if (isSaved) {
            this.saveLocationBtn.classList.add('saved');
            this.clearLocationBtn.style.display = 'block';
        } else {
            this.saveLocationBtn.classList.remove('saved');
            this.clearLocationBtn.style.display = 'none';
        }
    }

    showToast(message) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.style.display = 'block';
        this.weatherCard.style.display = 'none';
        this.loading.style.display = 'none';
    }

    showLoading() {
        this.loading.style.display = 'block';
        this.errorMessage.style.display = 'none';
        this.weatherCard.style.display = 'none';
    }

    async getWeather(city) {
        try {
            this.showLoading();
            const response = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch weather data');
            }

            if (data.success) {
                this.displayWeather(data.data, city, data.openweather_url);
                // Update save button state based on whether this city is saved
                this.updateSaveButton(city === this.getSavedCity());
            } else {
                this.showError(data.error);
            }
        } catch (error) {
            this.showError(error.message);
        }
    }

    displayWeather(weather, city, openWeatherUrl) {
        this.weatherCard.querySelector('.city-name').textContent = city;
        this.weatherCard.querySelector('.timestamp').textContent = weather.timestamp;
        this.weatherCard.querySelector('.temperature').textContent = `${weather.temperature}°C`;
        this.weatherCard.querySelector('.feels-like').textContent = `${weather.feels_like}°C`;
        this.weatherCard.querySelector('.humidity').textContent = `${weather.humidity}%`;
        this.weatherCard.querySelector('.description').textContent = 
            weather.description.charAt(0).toUpperCase() + weather.description.slice(1);
        
        this.weatherCard.querySelector('.more-details').href = openWeatherUrl;

        this.loading.style.display = 'none';
        this.errorMessage.style.display = 'none';
        this.weatherCard.style.display = 'block';
        
        // Trigger animation
        this.weatherCard.classList.add('visible');
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WeatherApp();
});