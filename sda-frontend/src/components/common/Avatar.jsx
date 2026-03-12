import React from 'react';

const Avatar = ({ user, size = 'medium', className = '' }) => {
  const sizes = {
    small: 32,
    medium: 48,
    large: 64,
    xlarge: 96,
  };

  const pixelSize = sizes[size] || sizes.medium;

  // Get the API base URL from environment or default
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const styles = {
    container: {
      width: pixelSize,
      height: pixelSize,
      borderRadius: '50%',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: user?.avatarUrl ? 'transparent' : '#667eea',
      color: 'white',
      fontWeight: 'bold',
      fontSize: pixelSize * 0.4,
    },
    image: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    },
  };

  if (user?.avatarUrl) {
    // Construct the full URL - add base URL if it's a relative path
    const imageUrl = user.avatarUrl.startsWith('http') 
      ? user.avatarUrl 
      : `${API_BASE_URL}${user.avatarUrl}`;

    return (
      <div style={styles.container} className={className}>
        <img 
          src={imageUrl} 
          alt={user.name || 'User'} 
          style={styles.image}
          onError={(e) => {
            console.error('Failed to load image:', imageUrl);
            // Fallback to initials on error
            e.target.style.display = 'none';
            e.target.parentElement.style.backgroundColor = '#667eea';
            e.target.parentElement.innerText = user.name?.[0]?.toUpperCase() || '?';
          }}
        />
      </div>
    );
  }

  // Fallback to initials
  const initials = user?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div style={styles.container} className={className}>
      {initials || '?'}
    </div>
  );
};

export default Avatar;