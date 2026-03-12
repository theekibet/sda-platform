// Group categories with display names and icons
export const GROUP_CATEGORIES = [
    { value: 'MUSIC', label: '🎸 Music & Worship', icon: '🎸' },
    { value: 'BIBLE_STUDY', label: '📖 Bible Study', icon: '📖' },
    { value: 'PRAYER', label: '🙏 Prayer Group', icon: '🙏' },
    { value: 'MENTAL_HEALTH', label: '🧠 Mental Health', icon: '🧠' },
    { value: 'SPORTS', label: '⚽ Sports & Recreation', icon: '⚽' },
    { value: 'ARTS', label: '🎨 Arts & Creativity', icon: '🎨' },
    { value: 'CAREER', label: '💼 Career & Growth', icon: '💼' },
    { value: 'OUTREACH', label: '🤝 Outreach & Service', icon: '🤝' },
    { value: 'ONLINE', label: '🌐 Online Community', icon: '🌐' },
    { value: 'OTHER', label: '✨ Other Interests', icon: '✨' },
  ];
  
  export const getCategoryLabel = (value) => {
    const category = GROUP_CATEGORIES.find(c => c.value === value);
    return category ? category.label : value;
  };
  
  export const getCategoryIcon = (value) => {
    const category = GROUP_CATEGORIES.find(c => c.value === value);
    return category ? category.icon : '📌';
  };