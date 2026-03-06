import React, { useState, useEffect } from 'react'

function StatusBar() {
  const [time, setTime] = useState(new Date())
  const [weather, setWeather] = useState(null)
  const [city, setCity] = useState('')

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Get location and weather
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords

        // Reverse geocode for city name
        try {
          const geoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`)
          const geoData = await geoRes.json()
          setCity(geoData.city || geoData.locality || '')
        } catch {}

        // Weather from Open-Meteo (free, no API key)
        try {
          const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&temperature_unit=fahrenheit`)
          const weatherData = await weatherRes.json()
          setWeather({
            temp: Math.round(weatherData.current.temperature_2m),
            code: weatherData.current.weather_code,
          })
        } catch {}
      }, () => {
        // Geolocation denied - that's fine
      })
    }
  }, [])

  const timeStr = time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const dateStr = time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  const getWeatherLabel = (code) => {
    if (code === 0) return 'Clear'
    if (code <= 3) return 'Cloudy'
    if (code <= 49) return 'Overcast'
    if (code <= 59) return 'Rain'
    if (code <= 69) return 'Sleet'
    if (code <= 79) return 'Snow'
    if (code <= 84) return 'Showers'
    if (code <= 99) return 'Storms'
    return 'Fair'
  }

  return (
    <div className="flex items-center gap-4 px-5 text-zen-muted" style={{ WebkitAppRegion: 'drag' }}>
      <div className="flex-1" />

      {/* Weather + City */}
      {weather && (
        <div className="flex items-center gap-1.5">
          <span className="text-xs">{weather.temp}°</span>
          <span className="text-xs text-zen-muted/50">{getWeatherLabel(weather.code)}</span>
          {city && <span className="text-xs text-zen-muted/30">{city}</span>}
        </div>
      )}

      {/* Date */}
      <span className="text-xs text-zen-muted/50">{dateStr}</span>

      {/* Time */}
      <span className="text-sm text-zen-text font-light tracking-wide">{timeStr}</span>
    </div>
  )
}

export default StatusBar
