// src/components/groups/MessageReactions.jsx
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const REACTION_EMOJIS = {
  like: '👍',
  love: '❤️',
  pray: '🙏',
  amen: '🙌',
  thanks: '🎉'
};

const REACTION_LABELS = {
  like: 'Like',
  love: 'Love',
  pray: 'Pray',
  amen: 'Amen',
  thanks: 'Thanks'
};

function MessageReactions({ messageId, reactions = [], onReact }) {
  const { user } = useAuth();
  const [showPicker, setShowPicker] = useState(false);
  const [showReactors, setShowReactors] = useState(false);

  // Group reactions by type and count them
  const reactionCounts = reactions.reduce((acc, reaction) => {
    acc[reaction.reaction] = (acc[reaction.reaction] || 0) + 1;
    return acc;
  }, {});

  // Get unique reaction types present
  const presentReactions = Object.keys(reactionCounts);

  // Check if current user has reacted with a specific reaction
  const userHasReacted = (reactionType) => {
    return reactions.some(r => r.userId === user?.id && r.reaction === reactionType);
  };

  // Get users who reacted with a specific reaction
  const getReactorsByType = (reactionType) => {
    return reactions
      .filter(r => r.reaction === reactionType)
      .map(r => r.user?.name || 'Anonymous');
  };

  const handleReactionClick = (reaction) => {
    onReact(reaction);
    setShowPicker(false);
  };

  const handleQuickReact = (reaction) => {
    onReact(reaction);
  };

  if (!reactions || reactions.length === 0) {
    // No reactions yet - show just the add reaction button
    return (
      <div style={styles.container}>
        <button
          onClick={() => setShowPicker(!showPicker)}
          style={styles.addReactionButton}
          title="Add reaction"
        >
          😊
        </button>
        
        {showPicker && (
          <ReactionPicker
            onSelect={handleReactionClick}
            onClose={() => setShowPicker(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Reaction bubbles */}
      <div style={styles.reactionsList}>
        {presentReactions.map(reactionType => (
          <button
            key={reactionType}
            onClick={() => handleQuickReact(reactionType)}
            style={{
              ...styles.reactionBubble,
              backgroundColor: userHasReacted(reactionType) ? '#e3f2fd' : '#f5f5f5',
              border: userHasReacted(reactionType) ? '1px solid #667eea' : '1px solid transparent',
            }}
            onMouseEnter={() => setShowReactors(reactionType)}
            onMouseLeave={() => setShowReactors(false)}
            title={`${REACTION_LABELS[reactionType]}: ${getReactorsByType(reactionType).join(', ')}`}
          >
            <span style={styles.reactionEmoji}>{REACTION_EMOJIS[reactionType]}</span>
            <span style={styles.reactionCount}>{reactionCounts[reactionType]}</span>
          </button>
        ))}
        
        {/* Add reaction button */}
        <button
          onClick={() => setShowPicker(!showPicker)}
          style={styles.addReactionButton}
          title="Add reaction"
        >
          +
        </button>
      </div>

      {/* Reaction picker popup */}
      {showPicker && (
        <ReactionPicker
          onSelect={handleReactionClick}
          onClose={() => setShowPicker(false)}
          userReactions={presentReactions}
        />
      )}

      {/* Reactors tooltip - simple version, you can enhance this */}
      {showReactors && (
        <div style={styles.reactorsTooltip}>
          {/* Tooltip content is handled by title attribute for simplicity */}
        </div>
      )}
    </div>
  );
}

// Reaction Picker Component
function ReactionPicker({ onSelect, onClose, userReactions = [] }) {
  const reactions = [
    { type: 'like', emoji: '👍', label: 'Like' },
    { type: 'love', emoji: '❤️', label: 'Love' },
    { type: 'pray', emoji: '🙏', label: 'Pray' },
    { type: 'amen', emoji: '🙌', label: 'Amen' },
    { type: 'thanks', emoji: '🎉', label: 'Thanks' },
  ];

  return (
    <div style={styles.picker}>
      <div style={styles.pickerHeader}>
        <span>Add Reaction</span>
        <button onClick={onClose} style={styles.closeButton}>✕</button>
      </div>
      <div style={styles.pickerGrid}>
        {reactions.map(({ type, emoji, label }) => (
          <button
            key={type}
            onClick={() => onSelect(type)}
            style={{
              ...styles.reactionOption,
              backgroundColor: userReactions.includes(type) ? '#e3f2fd' : 'transparent',
            }}
            title={userReactions.includes(type) ? 'You already reacted with this' : label}
          >
            <span style={styles.reactionOptionEmoji}>{emoji}</span>
            <span style={styles.reactionOptionLabel}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Styles
const styles = {
  container: {
    position: 'relative',
    marginTop: '4px',
    marginBottom: '2px',
  },
  reactionsList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    alignItems: 'center',
  },
  reactionBubble: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    borderRadius: '20px',
    border: 'none',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    ':hover': {
      backgroundColor: '#e0e0e0',
    },
  },
  reactionEmoji: {
    fontSize: '14px',
  },
  reactionCount: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#666',
  },
  addReactionButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    borderRadius: '14px',
    border: '1px solid #ddd',
    backgroundColor: 'white',
    fontSize: '16px',
    cursor: 'pointer',
    color: '#666',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: '#f0f0f0',
      borderColor: '#999',
    },
  },
  picker: {
    position: 'absolute',
    top: '30px',
    left: '0',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    padding: '12px',
    zIndex: 1000,
    minWidth: '200px',
    border: '1px solid #eaeaea',
  },
  pickerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
    paddingBottom: '8px',
    borderBottom: '1px solid #eaeaea',
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '14px',
    cursor: 'pointer',
    color: '#999',
    padding: '4px',
    ':hover': {
      color: '#666',
    },
  },
  pickerGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px',
  },
  reactionOption: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    border: '1px solid #eaeaea',
    borderRadius: '8px',
    backgroundColor: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: '#f5f5f5',
      borderColor: '#667eea',
    },
  },
  reactionOptionEmoji: {
    fontSize: '18px',
  },
  reactionOptionLabel: {
    fontSize: '13px',
    color: '#333',
    fontWeight: '500',
  },
  reactorsTooltip: {
    position: 'absolute',
    bottom: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#333',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    whiteSpace: 'nowrap',
    zIndex: 100,
    marginBottom: '4px',
  },
};

export default MessageReactions;