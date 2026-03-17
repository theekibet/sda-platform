// src/pages/members/learning/ResourceCard.jsx
import React from 'react';

const ResourceCard = ({ resource }) => {
  const getTypeIcon = (type) => {
    switch(type) {
      case 'website': return '🌐';
      case 'article': return '📄';
      case 'downloads': return '📥';
      case 'store': return '🛒';
      case 'program': return '📋';
      case 'seminars': return '🎓';
      case 'videos': return '📹';
      case 'app': return '📱';
      case 'paper': return '📑';
      default: return '🔗';
    }
  };

  const getTypeColor = (type) => {
    switch(type) {
      case 'website': return '#4299e1';
      case 'article': return '#48bb78';
      case 'downloads': return '#ed8936';
      case 'store': return '#9f7aea';
      case 'program': return '#f56565';
      case 'seminars': return '#38b2ac';
      case 'videos': return '#d53f8c';
      case 'app': return '#805ad5';
      case 'paper': return '#718096';
      default: return '#667eea';
    }
  };

  const handleClick = () => {
    window.open(resource.url, '_blank', 'noopener noreferrer');
  };

  return (
    <div style={styles.card} onClick={handleClick}>
      {/* Card Header */}
      <div style={styles.cardHeader}>
        <div style={styles.typeBadge}>
          <span style={{
            ...styles.typeIcon,
            backgroundColor: getTypeColor(resource.type) + '20',
            color: getTypeColor(resource.type)
          }}>
            {getTypeIcon(resource.type)} {resource.type}
          </span>
        </div>
        <div style={styles.cardIcon}>{resource.icon}</div>
      </div>

      {/* Content */}
      <div style={styles.cardContent}>
        <h3 style={styles.cardTitle}>{resource.title}</h3>
        <p style={styles.cardDescription}>{resource.description}</p>
        
        {/* Author */}
        {resource.author && (
          <div style={styles.author}>
            <span style={styles.authorLabel}>By:</span>
            <span style={styles.authorName}>{resource.author}</span>
          </div>
        )}

        {/* Tags */}
        {resource.tags && resource.tags.length > 0 && (
          <div style={styles.tags}>
            {resource.tags.slice(0, 3).map((tag, index) => (
              <span key={index} style={styles.tag}>#{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={styles.cardFooter}>
        <span style={styles.visitLink}>Visit Resource →</span>
      </div>
    </div>
  );
};

const styles = {
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    ':hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 12px 24px rgba(102, 126, 234, 0.15)',
    },
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
  },
  typeBadge: {
    display: 'flex',
    alignItems: 'center',
  },
  typeIcon: {
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  cardIcon: {
    fontSize: '32px',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    margin: '0 0 10px 0',
    color: '#333',
    fontSize: '18px',
    fontWeight: '600',
    lineHeight: '1.4',
  },
  cardDescription: {
    color: '#666',
    fontSize: '14px',
    lineHeight: '1.6',
    marginBottom: '15px',
  },
  author: {
    marginBottom: '10px',
    fontSize: '13px',
  },
  authorLabel: {
    color: '#999',
    marginRight: '5px',
  },
  authorName: {
    color: '#667eea',
    fontWeight: '500',
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '5px',
    marginBottom: '10px',
  },
  tag: {
    fontSize: '11px',
    color: '#718096',
    backgroundColor: '#f7fafc',
    padding: '2px 8px',
    borderRadius: '12px',
  },
  cardFooter: {
    marginTop: '15px',
    paddingTop: '15px',
    borderTop: '1px solid #edf2f7',
  },
  visitLink: {
    color: '#667eea',
    fontSize: '14px',
    fontWeight: '500',
  },
};

export default ResourceCard;