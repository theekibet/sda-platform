// src/pages/members/Dashboard.jsx
import React from 'react';
import VerseOfTheDay from '../../components/bible/VerseOfTheDay';
import { useAuth } from '../../contexts/AuthContext';
import { useState, useEffect } from 'react';

// Greeting Component (embedded in Dashboard for now)
const Greeting = () => {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState('');
  const [icon, setIcon] = useState('');
  const [weather, setWeather] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);
  const [holiday, setHoliday] = useState(null);
  const [upcomingHolidays, setUpcomingHolidays] = useState([]);

  // Get weather based on user's location
  useEffect(() => {
    if (navigator.geolocation) {
      setLoadingWeather(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const response = await fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto&forecast_days=3`
            );
            const data = await response.json();
            
            if (data.current_weather) {
              const temp = Math.round(data.current_weather.temperature);
              const weatherCode = data.current_weather.weathercode;
              
              const weatherIcons = {
                0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
                45: '🌫️', 48: '🌫️', 51: '🌧️', 53: '🌧️',
                55: '🌧️', 61: '🌧️', 63: '🌧️', 65: '🌧️',
                71: '🌨️', 73: '🌨️', 75: '🌨️', 77: '🌨️',
                80: '🌧️', 81: '🌧️', 82: '🌧️', 85: '🌨️',
                86: '🌨️', 95: '⛈️', 96: '⛈️', 99: '⛈️',
              };
              
              setWeather({
                temp,
                icon: weatherIcons[weatherCode] || '☁️',
                condition: weatherCode,
                forecast: data.daily ? {
                  max: Math.round(data.daily.temperature_2m_max[0]),
                  min: Math.round(data.daily.temperature_2m_min[0]),
                } : null
              });
            }
          } catch (error) {
            console.error('Error fetching weather:', error);
          } finally {
            setLoadingWeather(false);
          }
        },
        (error) => {
          console.log('Location permission denied:', error);
          setLocationDenied(true);
          setLoadingWeather(false);
        }
      );
    } else {
      setLocationDenied(true);
    }
  }, []);

  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
    const month = now.getMonth();
    const date = now.getDate();
    const year = now.getFullYear();
    
    const easterDate = getEasterDate(year);
    const goodFridayDate = new Date(easterDate);
    goodFridayDate.setDate(easterDate.getDate() - 2);
    
    const isChristmas = month === 11 && date === 25;
    const isEaster = now.toDateString() === easterDate.toDateString();
    const isGoodFriday = now.toDateString() === goodFridayDate.toDateString();
    const isNewYear = month === 0 && date === 1;
    
    const upcoming = [];
    const christmasDate = new Date(year, 11, 25);
    if (christmasDate > now) {
      upcoming.push({
        name: 'Christmas',
        date: christmasDate,
        icon: '🎄',
        daysUntil: Math.ceil((christmasDate - now) / (1000 * 60 * 60 * 24))
      });
    }
    
    let nextEaster = easterDate > now ? easterDate : getEasterDate(year + 1);
    upcoming.push({
      name: 'Easter',
      date: nextEaster,
      icon: '🐣',
      daysUntil: Math.ceil((nextEaster - now) / (1000 * 60 * 60 * 24))
    });
    
    upcoming.sort((a, b) => a.daysUntil - b.daysUntil);
    setUpcomingHolidays(upcoming.slice(0, 3));
    
    if (isChristmas) {
      setHoliday({ name: 'Christmas Day', message: 'Merry Christmas! 🎄', icon: '🎄', color: '#e74c3c' });
      setGreeting('Merry Christmas');
      setIcon('🎄');
    } else if (isEaster) {
      setHoliday({ name: 'Easter Sunday', message: 'He is Risen! ✝️', icon: '✝️', color: '#f1c40f' });
      setGreeting('Happy Easter');
      setIcon('✝️');
    } else if (isGoodFriday) {
      setHoliday({ name: 'Good Friday', message: 'A day of reflection ✝️', icon: '✝️', color: '#7f8c8d' });
      setGreeting('Good Friday');
      setIcon('✝️');
    } else if (isNewYear) {
      setHoliday({ name: "New Year's Day", message: 'Happy New Year! 🎉', icon: '🎉', color: '#9b59b6' });
      setGreeting('Happy New Year');
      setIcon('🎉');
    } else {
      if (hour < 12) {
        setGreeting('Good Morning');
        setIcon('🌅');
      } else if (hour < 17) {
        setGreeting('Good Afternoon');
        setIcon('☀️');
      } else if (hour < 20) {
        setGreeting('Good Evening');
        setIcon('🌆');
      } else {
        setGreeting('Good Night');
        setIcon('🌙');
      }
    }
  }, []);

  const getEasterDate = (year) => {
    const f = Math.floor;
    const G = year % 19;
    const C = f(year / 100);
    const H = (C - f(C / 4) - f((8 * C + 13) / 25) + 19 * G + 15) % 30;
    const I = H - f(H / 28) * (1 - f(29 / (H + 1)) * f((21 - G) / 11));
    const J = (year + f(year / 4) + I + 2 - C + f(C / 4)) % 7;
    const L = I - J;
    const month = 3 + f((L + 40) / 44);
    const day = L + 28 - 31 * f(month / 4);
    return new Date(year, month - 1, day);
  };

  const getDayMessage = () => {
    const day = new Date().getDay();
    const messages = {
      0: { emoji: '🙏', text: 'Blessed Sunday' },
      1: { emoji: '💪', text: 'Make it a great Monday' },
      2: { emoji: '🌟', text: 'Trust His plan Tuesday' },
      3: { emoji: '📖', text: 'Wisdom Wednesday' },
      4: { emoji: '🙌', text: 'Thankful Thursday' },
      5: { emoji: '✨', text: 'Faith-filled Friday' },
      6: { emoji: '🕊️', text: 'Sabbath Saturday' },
    };
    return messages[day] || { emoji: '🙏', text: 'Blessed day' };
  };

  const dayMessage = getDayMessage();

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div style={greetingStyles.container}>
      <div style={greetingStyles.greetingSection}>
        <span style={greetingStyles.mainIcon}>{holiday?.icon || icon}</span>
        <div style={greetingStyles.textContainer}>
          <div style={greetingStyles.titleRow}>
            <h2 style={{ ...greetingStyles.greeting, color: holiday?.color || 'white' }}>
              {holiday ? holiday.message : `${greeting}, ${user?.name?.split(' ')[0] || 'Friend'}!`}
            </h2>
            <span style={greetingStyles.dayTag}>
              {dayMessage.emoji} {dayMessage.text}
            </span>
          </div>
          <p style={greetingStyles.date}>
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
            })}
          </p>
        </div>
      </div>

      <div style={greetingStyles.weatherSection}>
        {loadingWeather ? (
          <div style={greetingStyles.weatherLoading}>
            <span style={greetingStyles.weatherIcon}>⏳</span>
            <span>Loading...</span>
          </div>
        ) : weather ? (
          <div style={greetingStyles.weatherDisplay}>
            <span style={greetingStyles.weatherIcon}>{weather.icon}</span>
            <div style={greetingStyles.weatherInfo}>
              <span style={greetingStyles.weatherTemp}>{weather.temp}°C</span>
              {weather.forecast && (
                <span style={greetingStyles.weatherRange}>
                  H:{weather.forecast.max}° L:{weather.forecast.min}°
                </span>
              )}
            </div>
          </div>
        ) : (
          <div style={greetingStyles.weatherPlaceholder}>
            <span style={greetingStyles.weatherIcon}>⛅</span>
            <span>Weather unavailable</span>
          </div>
        )}
      </div>

      <div style={greetingStyles.calendarSection}>
        <div style={greetingStyles.calendarHeader}>
          <span style={greetingStyles.calendarIcon}>📅</span>
          <span style={greetingStyles.calendarTitle}>Upcoming</span>
        </div>
        {upcomingHolidays.length > 0 && (
          <div style={greetingStyles.holidayList}>
            {upcomingHolidays.map((holiday, index) => (
              <div key={index} style={greetingStyles.holidayItem}>
                <span style={greetingStyles.holidayIcon}>{holiday.icon}</span>
                <div style={greetingStyles.holidayInfo}>
                  <span style={greetingStyles.holidayName}>{holiday.name}</span>
                  <span style={greetingStyles.holidayDate}>{formatDate(holiday.date)}</span>
                </div>
                <span style={greetingStyles.holidayDays}>
                  {holiday.daysUntil === 0 ? 'Today!' : 
                   holiday.daysUntil === 1 ? 'Tomorrow' : 
                   `${holiday.daysUntil} days`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Main Dashboard Component
const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div style={styles.container}>
      {/* Greeting Section */}
      <Greeting />

      {/* Verse of the Day - Prominently displayed after greeting */}
      <VerseOfTheDay />

      {/* Quick Stats */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>🙏</div>
          <div style={styles.statInfo}>
            <h3 style={styles.statNumber}>12</h3>
            <p style={styles.statLabel}>Prayer Requests</p>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>🤝</div>
          <div style={styles.statInfo}>
            <h3 style={styles.statNumber}>3</h3>
            <p style={styles.statLabel}>Active Groups</p>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>📖</div>
          <div style={styles.statInfo}>
            <h3 style={styles.statNumber}>5</h3>
            <p style={styles.statLabel}>Verses Read</p>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>❤️</div>
          <div style={styles.statInfo}>
            <h3 style={styles.statNumber}>24</h3>
            <p style={styles.statLabel}>Community Likes</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={styles.actionsSection}>
        <h3 style={styles.sectionTitle}>⚡ Quick Actions</h3>
        <div style={styles.actionsGrid}>
          <button style={styles.actionButton} onClick={() => window.location.href = '/prayer-wall'}>
            <span style={styles.actionIcon}>🙏</span>
            <span style={styles.actionLabel}>Post Prayer</span>
          </button>

          <button style={styles.actionButton} onClick={() => window.location.href = '/bible/reader'}>
            <span style={styles.actionIcon}>📖</span>
            <span style={styles.actionLabel}>Read Bible</span>
          </button>

          <button style={styles.actionButton} onClick={() => window.location.href = '/groups'}>
            <span style={styles.actionIcon}>🤝</span>
            <span style={styles.actionLabel}>Join Group</span>
          </button>

          <button style={styles.actionButton} onClick={() => window.location.href = '/discover'}>
            <span style={styles.actionIcon}>🔥</span>
            <span style={styles.actionLabel}>Discover</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const greetingStyles = {
  container: {
    display: 'grid',
    gridTemplateColumns: '1fr auto auto',
    gap: '16px',
    marginBottom: '30px',
    padding: '20px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '16px',
    color: 'white',
  },
  greetingSection: { display: 'flex', alignItems: 'center', gap: '16px', minWidth: '300px' },
  mainIcon: { fontSize: '48px', lineHeight: 1 },
  textContainer: { flex: 1 },
  titleRow: { display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '4px' },
  greeting: { margin: 0, fontSize: '24px', fontWeight: '700', letterSpacing: '-0.5px' },
  dayTag: { backgroundColor: 'rgba(255, 255, 255, 0.2)', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '500', backdropFilter: 'blur(5px)' },
  date: { margin: 0, fontSize: '14px', opacity: 0.9 },
  weatherSection: { minWidth: '140px', backgroundColor: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(10px)', borderRadius: '12px', padding: '12px', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  weatherDisplay: { display: 'flex', alignItems: 'center', gap: '12px' },
  weatherIcon: { fontSize: '32px' },
  weatherInfo: { display: 'flex', flexDirection: 'column' },
  weatherTemp: { fontSize: '22px', fontWeight: '700', lineHeight: 1.2 },
  weatherRange: { fontSize: '11px', opacity: 0.8 },
  weatherLoading: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' },
  weatherPlaceholder: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', opacity: 0.7 },
  calendarSection: { minWidth: '240px', backgroundColor: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(10px)', borderRadius: '12px', padding: '12px', border: '1px solid rgba(255,255,255,0.2)' },
  calendarHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.2)' },
  calendarIcon: { fontSize: '18px' },
  calendarTitle: { fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.9 },
  holidayList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  holidayItem: { display: 'grid', gridTemplateColumns: '24px 1fr auto', alignItems: 'center', gap: '8px', fontSize: '13px', padding: '4px 0' },
  holidayIcon: { fontSize: '16px' },
  holidayInfo: { display: 'flex', flexDirection: 'column' },
  holidayName: { fontWeight: '500', fontSize: '13px' },
  holidayDate: { fontSize: '11px', opacity: '0.7' },
  holidayDays: { fontSize: '11px', backgroundColor: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '12px', whiteSpace: 'nowrap' },
};

const styles = {
  container: { maxWidth: '1200px', margin: '0 auto', padding: '20px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' },
  statCard: { backgroundColor: 'white', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  statIcon: { fontSize: '36px' },
  statInfo: { flex: 1 },
  statNumber: { margin: '0 0 4px 0', fontSize: '28px', fontWeight: '700', color: '#333' },
  statLabel: { margin: 0, fontSize: '13px', color: '#666', fontWeight: '500' },
  actionsSection: { marginBottom: '30px' },
  sectionTitle: { fontSize: '20px', fontWeight: '700', color: '#333', marginBottom: '16px' },
  actionsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' },
  actionButton: { backgroundColor: 'white', border: '2px solid #e2e8f0', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  actionIcon: { fontSize: '32px' },
  actionLabel: { fontSize: '14px', fontWeight: '600', color: '#333' },
};

export default Dashboard;