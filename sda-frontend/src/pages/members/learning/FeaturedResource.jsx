// src/pages/members/learning/FeaturedResource.jsx
import React from 'react';

const FeaturedResource = ({ resource }) => {
  const handleClick = () => {
    window.open(resource.url, '_blank', 'noopener noreferrer');
  };

  return (
    <div style={styles.card} onClick={handleClick}>
      <div style={styles.cardInner}>
        <div style={styles.iconSection}>
          <div style={styles.icon}>{resource.icon}</div>
        </div>
        <div style={styles.contentSection}>
          <h3 style={styles.title}>{resource.title}</h3>
          <p style={styles.description}>{resource.description}</p>
          {resource.author && (
            <div style={styles.author}>{resource.author}</div>
          )}
          <div style={styles.tags}>
            {resource.tags.slice(0, 3).map((tag, index) => (
              <span key={index} style={styles.tag}>#{tag}</span>
            ))}
          </div>
          <div style={styles.link}>Explore →</div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.15)',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    border: '2px solid #667eea20',
    overflow: 'hidden',
    ':hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 16px 32px rgba(102, 126, 234, 0.25)',
    },
  },
  cardInner: {
    display: 'flex',
    padding: '20px',
    gap: '20px',
  },
  iconSection: {
    flexShrink: 0,
  },
  icon: {
    width: '60px',
    height: '60px',
    borderRadius: '30px',
    backgroundColor: '#667eea20',
    color: '#667eea',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '30px',
  },
  contentSection: {
    flex: 1,
  },
  title: {
    margin: '0 0 8px 0',
    color: '#333',
    fontSize: '18px',
    fontWeight: '600',
  },
  description: {
    color: '#666',
    fontSize: '14px',
    lineHeight: '1.5',
    marginBottom: '10px',
  },
  author: {
    color: '#999',
    fontSize: '13px',
    marginBottom: '8px',
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '5px',
    marginBottom: '10px',
  },
  tag: {
    fontSize: '11px',
    color: '#667eea',
    backgroundColor: '#f0f4ff',
    padding: '2px 8px',
    borderRadius: '12px',
  },
  link: {
    color: '#667eea',
    fontSize: '14px',
    fontWeight: '500',
  },
};

export default FeaturedResource;