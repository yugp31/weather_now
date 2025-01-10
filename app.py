from flask import Flask, request, render_template, jsonify, send_from_directory
import requests
from dotenv import load_dotenv
import os
from datetime import datetime
import logging
from functools import lru_cache
import time

# Load environment variables
load_dotenv()

app = Flask(__name__, template_folder='.')  # Change template_folder to root directory

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Cache weather data for 5 minutes to avoid excessive API calls
CACHE_DURATION = 300  # seconds

class WeatherAPIError(Exception):
    """Custom exception for weather API errors"""
    pass

@lru_cache(maxsize=100)
def get_cached_weather(city: str, timestamp: int):
    """
    Get weather data with caching. Timestamp parameter ensures cache updates every CACHE_DURATION seconds.
    """
    try:
        api_key = os.getenv('OPENWEATHER_API_KEY')
        if not api_key:
            raise WeatherAPIError("API key not configured")
        
        base_url = "http://api.openweathermap.org/data/2.5/weather"
        params = {
            'q': city,
            'appid': api_key,
            'units': 'metric'
        }
        
        response = requests.get(base_url, params=params, timeout=5)
        response.raise_for_status()
        
        data = response.json()
        if data["cod"] != 200:
            raise WeatherAPIError(data.get("message", "City not found"))
        
        return {
            'temperature': round(data["main"]["temp"], 1),
            'feels_like': round(data["main"]["feels_like"], 1),
            'humidity': data["main"]["humidity"],
            'description': data["weather"][0]["description"],
            'icon': data["weather"][0]["icon"],
            'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        
    except requests.exceptions.Timeout:
        raise WeatherAPIError("Request timed out. Please try again.")
    except requests.exceptions.RequestException as e:
        logger.error(f"API request failed: {str(e)}")
        raise WeatherAPIError("Failed to fetch weather data")
    except (KeyError, ValueError) as e:
        logger.error(f"Data parsing error: {str(e)}")
        raise WeatherAPIError("Error processing weather data")

@app.route('/')
def home():
    return render_template("index.html")  # Flask will now look for index.html in the root folder

@app.route('/api/weather')
def weather_api():
    city = request.args.get('city', '').strip()
    
    if not city:
        return jsonify({'error': 'Please enter a city name'}), 400
        
    try:
        # Create timestamp that changes every CACHE_DURATION seconds
        cache_timestamp = int(time.time() / CACHE_DURATION)
        weather_data = get_cached_weather(city, cache_timestamp)
        
        return jsonify({
            'success': True,
            'data': weather_data,
            'openweather_url': f"https://zoom.earth?q={city}"
        })
        
    except WeatherAPIError as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'An unexpected error occurred'
        }), 500

@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Resource not found'}), 404

@app.errorhandler(500)
def server_error(e):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == "__main__":
    app.run(debug=os.getenv('FLASK_ENV') == 'development')