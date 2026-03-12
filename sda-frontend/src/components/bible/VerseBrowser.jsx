// src/components/Bible/VerseBrowser.jsx
import React, { useState } from 'react';
import { bibleService } from '../../services/bibleService';
import VerseCard from './VerseCard';

const VerseBrowser = ({ onSelectVerse }) => {
  const [reference, setReference] = useState('');
  const [verse, setVerse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [translations, setTranslations] = useState([]);
  const [selectedTranslation, setSelectedTranslation] = useState('kjv');

  // Load translations on mount
  useState(() => {
    bibleService.getTranslations().then(res => {
      setTranslations(res.data.data || []);
    });
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!reference.trim()) return;

    setLoading(true);
    setError('');
    setVerse(null);

    try {
      const response = await bibleService.getVerse(reference, selectedTranslation);
      setVerse(response.data.data);
    } catch (err) {
      setError('Verse not found. Please check the reference.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>📖 Browse Bible Verses</h2>

      <form onSubmit={handleSearch} style={styles.searchForm}>
        <div style={styles.inputGroup}>
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="e.g., John 3:16"
            style={styles.input}
          />
          
          <select
            value={selectedTranslation}
            onChange={(e) => setSelectedTranslation(e.target.value)}
            style={styles.select}
          >
            {translations.map(t => (
              <option key={t.code} value={t.code}>
                {t.name}
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={loading}
            style={styles.searchButton}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {error && <div style={styles.error}>{error}</div>}

      {verse && (
        <div style={styles.result}>
          <VerseCard verse={verse} />
          
          {onSelectVerse && (
            <button
              onClick={() => onSelectVerse(verse)}
              style={styles.selectButton}
            >
              Select This Verse
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
  },
  title: {
    color: '#333',
    marginBottom: '20px',
  },
  searchForm: {
    marginBottom: '20px',
  },
  inputGroup: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  input: {
    flex: 2,
    minWidth: '200px',
    padding: '10px',
    borderRadius: '5px',
    border: '1px solid #ddd',
    fontSize: '16px',
  },
  select: {
    flex: 1,
    minWidth: '150px',
    padding: '10px',
    borderRadius: '5px',
    border: '1px solid #ddd',
    fontSize: '16px',
  },
  searchButton: {
    padding: '10px 20px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  error: {
    padding: '10px',
    backgroundColor: '#fee',
    color: '#c33',
    borderRadius: '5px',
    marginBottom: '15px',
  },
  result: {
    marginTop: '20px',
  },
  selectButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
    marginTop: '15px',
  },
};

export default VerseBrowser;