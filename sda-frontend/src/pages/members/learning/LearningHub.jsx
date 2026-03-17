// src/pages/members/learning/LearningHub.jsx
import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import ResourceCard from './ResourceCard';
import CategoryFilter from './CategoryFilter';
import FeaturedResource from './FeaturedResource';

const LearningHub = () => {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Categories with icons and descriptions
  const categories = [
    { id: 'all', name: 'All Resources', icon: '📚', color: '#667eea' },
    { id: 'bible-study', name: 'Bible Study & Prophecy', icon: '📖', color: '#4299e1' },
    { id: 'evangelism', name: 'Evangelism', icon: '🙏', color: '#48bb78' },
    { id: 'health', name: 'Health & Wellness', icon: '🏥', color: '#ed8936' },
    { id: 'family', name: 'Family & Parenting', icon: '👨‍👩‍👧‍👦', color: '#9f7aea' },
    { id: 'mission', name: 'Mission & Stories', icon: '🌍', color: '#f56565' },
    { id: 'ai-tools', name: 'AI Study Tools', icon: '🤖', color: '#38b2ac' },
    { id: 'history', name: 'History & Theology', icon: '📜', color: '#805ad5' },
    { id: 'youth', name: 'Youth & Leadership', icon: '👥', color: '#d53f8c' },
  ];

  // Resources data
  const resources = [
    // Bible Study & Prophecy
    {
      id: 1,
      category: 'bible-study',
      title: 'Adult Sabbath School Bible Study Guide',
      description: 'The official weekly lesson study guide used by Adventists worldwide. Includes current and past quarters with in-depth study.',
      url: 'https://www.adultbiblestudyguide.org/',
      icon: '📖',
      author: 'General Conference',
      type: 'website',
      tags: ['sabbath school', 'quarterly', 'lesson study'],
      featured: true,
    },
    {
      id: 2,
      category: 'bible-study',
      title: 'How to Study Bible Prophecy',
      description: 'Shawn Boonstra explores Old Testament foundations of Revelation symbols and allusions. Companion book available at Voice of Prophecy.',
      url: 'https://www.voiceofprophecy.com/articles/news/shawn-boonstra%E2%80%99s-sabbath-school-guide-explores-unchanging-prophetic-message',
      icon: '🔮',
      author: 'Shawn Boonstra',
      type: 'article',
      tags: ['prophecy', 'revelation', 'daniel'],
    },

    // Evangelism Resources
    {
      id: 3,
      category: 'evangelism',
      title: 'Pentecost 2025 Proclamation Resources',
      description: 'Free downloadable evangelistic series including "New Beginnings" (multiple languages), "Discovering Revelation," and "Jesus 101." Includes PowerPoints and sermon notes.',
      url: 'https://pentecost2025.com/proclamation-resources/',
      icon: '🔥',
      author: 'North American Division',
      type: 'downloads',
      tags: ['evangelism', 'sermons', 'presentations'],
      featured: true,
    },
    {
      id: 4,
      category: 'evangelism',
      title: 'Seminars Unlimited',
      description: 'The North American Division\'s "One-Stop Shop" for evangelism resources. Find Share Him materials, Bibles, books, Bible study guides, and videos.',
      url: 'https://www.seminarsunlimited.org',
      icon: '📦',
      author: 'North American Division',
      type: 'store',
      tags: ['resources', 'materials', 'sharing'],
    },

    // Health & Wellness
    {
      id: 5,
      category: 'health',
      title: 'NEW START Lifestyle Program',
      description: 'Based on Adventist health principles: Nutrition, Exercise, Water, Sunshine, Temperance, Air, Rest, and Trust in God. Featured at Uchee Pines and Wildwood Institute.',
      url: 'https://ucheepines.org/newstart',
      icon: '🌱',
      author: 'Uchee Pines Institute',
      type: 'program',
      tags: ['health', 'lifestyle', 'wellness'],
      featured: true,
    },
    {
      id: 6,
      category: 'health',
      title: 'Steps to Financial Success',
      description: 'Free short seminars (approx. 5 minutes each) exploring financial wellness nuggets designed to accompany evangelistic presentations.',
      url: 'https://pentecost2025.com/proclamation-resources/',
      icon: '💰',
      author: 'North American Division',
      type: 'seminars',
      tags: ['finance', 'stewardship', 'seminars'],
    },
    {
      id: 7,
      category: 'health',
      title: 'Remind Mental Health Program',
      description: 'A church-developed program helping people understand mental health fundamentals and supporting those with mental disorders.',
      url: 'https://adventist.org.au/ministries/family/',
      icon: '🧠',
      author: 'Australian Union Conference',
      type: 'program',
      tags: ['mental health', 'counseling', 'support'],
    },

    // Family & Parenting
    {
      id: 8,
      category: 'family',
      title: 'Rebuilding the Family Altar',
      description: 'Resources for establishing daily family devotion and Bible study time to build mental and spiritual strength together.',
      url: 'https://adventist.org.au/ministries/family/',
      icon: '🏠',
      author: 'Australian Union Conference',
      type: 'resources',
      tags: ['family', 'devotion', 'worship'],
    },
    {
      id: 9,
      category: 'family',
      title: 'The Worship Project',
      description: 'Family ministry resources helping families create shared worship experiences and strengthen bonds through daily connection with God.',
      url: 'https://adventist.org.au/ministries/family/',
      icon: '🎵',
      author: 'Australian Union Conference',
      type: 'resources',
      tags: ['worship', 'family', 'children'],
    },

    // Mission & Stories
    {
      id: 10,
      category: 'mission',
      title: 'Mission Spotlight®',
      description: 'Weekly videos featuring stories from the mission field around the world. Perfect for inspiring your community with real-life testimonies.',
      url: 'https://am.adventistmission.org/mission-spotlight',
      icon: '📹',
      author: 'Adventist Mission',
      type: 'videos',
      tags: ['missions', 'testimonies', 'global'],
      featured: true,
    },
    {
      id: 11,
      category: 'mission',
      title: 'Stories of Hope',
      description: 'Powerful first-hand accounts of lives changed by the gospel, featuring testimonies like Adhilakshmi\'s miracle story from India.',
      url: 'https://www.hopetv.org/shows/hope-channel-originals/stories-of-hope',
      icon: '✨',
      author: 'Hope Channel',
      type: 'videos',
      tags: ['testimonies', 'miracles', 'hope'],
    },

    // AI Study Tools
    {
      id: 12,
      category: 'ai-tools',
      title: '7chat.ai',
      description: 'Free AI platform developed by the Seventh-day Adventist Church based on its doctrines. Offers biblical answers, sermon suggestions, studies, and devotionals. Available in multiple languages.',
      url: 'https://play.google.com/store/apps/details?id=org.adventistas.ia_android',
      icon: '🤖',
      author: 'South American Division',
      type: 'app',
      tags: ['ai', 'chatbot', 'study'],
      featured: true,
    },

    // History & Theology
    {
      id: 13,
      category: 'history',
      title: 'Adventist Remnant Ecclesiology',
      description: 'A scholarly survey tracing Adventist theological reflections from 1844 to present, exploring the concept of the remnant church.',
      url: 'https://philpapers.org/rec/LAZARE',
      icon: '📚',
      author: 'Lazarus, S.',
      type: 'paper',
      tags: ['theology', 'history', 'remnant'],
    },
    {
      id: 14,
      category: 'history',
      title: 'Mission History in Africa',
      description: 'A study of the development of the Seventh-day Adventist Church in Northeast Tanzania (1903–2023), examining pioneer contributions and growth factors.',
      url: 'https://irepository.aua.ac.ke/items/a81d1f24-a84d-43dd-ac0e-6e0690d8cd87/full',
      icon: '🌍',
      author: 'Adventist University of Africa',
      type: 'paper',
      tags: ['africa', 'missions', 'history'],
    },

    // Youth & Leadership
    {
      id: 15,
      category: 'youth',
      title: 'NextGen CELEBRATIONS!',
      description: 'ADRA\'s youth-led health initiative based on holistic health principles. Young people lead activities focused on mental wellbeing, exercise, nutrition, and social support.',
      url: 'https://adra.org/fr/gen-z-christians-are-championing-healthy-lifestyles',
      icon: '🎉',
      author: 'ADRA',
      type: 'program',
      tags: ['youth', 'health', 'leadership'],
      featured: true,
    },
  ];

  // Filter resources based on category and search
  const filteredResources = resources.filter(resource => {
    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (resource.tags && resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesCategory && matchesSearch;
  });

  // Get featured resources
  const featuredResources = resources.filter(r => r.featured);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>📚 SDA Learning Hub</h1>
          <p style={styles.subtitle}>
            Discover trusted resources for Bible study, health, family, and spiritual growth
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div style={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search resources by title, description, or tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.searchInput}
        />
        <span style={styles.searchIcon}>🔍</span>
      </div>

      {/* Categories Filter */}
      <CategoryFilter
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* Featured Resources Section */}
      {selectedCategory === 'all' && searchQuery === '' && (
        <div style={styles.featuredSection}>
          <h2 style={styles.sectionTitle}>✨ Featured Resources</h2>
          <div style={styles.featuredGrid}>
            {featuredResources.map(resource => (
              <FeaturedResource key={resource.id} resource={resource} />
            ))}
          </div>
        </div>
      )}

      {/* Resources Grid */}
      <div style={styles.resourcesSection}>
        <h2 style={styles.sectionTitle}>
          {selectedCategory === 'all' 
            ? '📋 All Resources' 
            : `${categories.find(c => c.id === selectedCategory)?.icon} ${categories.find(c => c.id === selectedCategory)?.name}`}
        </h2>
        
        {filteredResources.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🔍</div>
            <h3>No resources found</h3>
            <p>Try adjusting your search or filter</p>
          </div>
        ) : (
          <div style={styles.resourcesGrid}>
            {filteredResources.map(resource => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        )}
      </div>

      {/* Footer Note */}
      <div style={styles.footer}>
        <p>
          These resources are trusted SDA study materials. 
          Click any card to visit the external resource.
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
  },
  header: {
    marginBottom: '30px',
    textAlign: 'center',
  },
  title: {
    fontSize: '36px',
    color: '#333',
    marginBottom: '10px',
  },
  subtitle: {
    fontSize: '16px',
    color: '#666',
    maxWidth: '600px',
    margin: '0 auto',
  },
  searchContainer: {
    position: 'relative',
    maxWidth: '600px',
    margin: '0 auto 30px',
  },
  searchInput: {
    width: '100%',
    padding: '15px 20px 15px 50px',
    fontSize: '16px',
    border: '2px solid #e0e0e0',
    borderRadius: '30px',
    outline: 'none',
    transition: 'border-color 0.2s',
    ':focus': {
      borderColor: '#667eea',
    },
  },
  searchIcon: {
    position: 'absolute',
    left: '20px',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '18px',
    color: '#999',
  },
  featuredSection: {
    marginBottom: '40px',
  },
  sectionTitle: {
    fontSize: '24px',
    color: '#333',
    marginBottom: '20px',
    borderBottom: '2px solid #667eea',
    paddingBottom: '10px',
  },
  featuredGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
  },
  resourcesSection: {
    marginBottom: '40px',
  },
  resourcesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px',
    backgroundColor: '#f9f9f9',
    borderRadius: '12px',
    color: '#999',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '15px',
  },
  footer: {
    marginTop: '40px',
    padding: '20px',
    backgroundColor: '#f0f4ff',
    borderRadius: '10px',
    textAlign: 'center',
    color: '#667eea',
    fontSize: '14px',
  },
};

export default LearningHub;