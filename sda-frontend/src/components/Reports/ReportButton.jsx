import React, { useState } from 'react';
import ReportModal from './ReportModal';
import { CONTENT_TYPES } from '../../utils/constants';

const ReportButton = ({ 
  contentType, 
  contentId, 
  authorId,
  size = 'small',
  variant = 'icon',
  onReportSubmitted,
  className = '',
}) => {
  const [showModal, setShowModal] = useState(false);

  // Don't render if no contentId
  if (!contentId) return null;

  const handleOpenModal = (e) => {
    e?.stopPropagation();
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleReportSubmitted = (result) => {
    setShowModal(false);
    if (onReportSubmitted) {
      onReportSubmitted(result);
    }
  };

  // Get content type label for tooltip
  const getContentTypeLabel = () => {
    switch (contentType) {
      case CONTENT_TYPES.FORUM_POST: return 'post';
      case CONTENT_TYPES.FORUM_REPLY: return 'reply';
      case CONTENT_TYPES.PRAYER_REQUEST: return 'prayer request';
      case CONTENT_TYPES.TESTIMONY: return 'testimony';
      case CONTENT_TYPES.GROUP_DISCUSSION: return 'discussion';
      case CONTENT_TYPES.USER: return 'user';
      default: return 'content';
    }
  };

  // Icon button style (default)
  if (variant === 'icon') {
    return (
      <>
        <button
          onClick={handleOpenModal}
          className={`report-button ${className}`}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: size === 'small' ? '4px' : '8px',
            borderRadius: '4px',
            color: '#999',
            fontSize: size === 'small' ? '14px' : '16px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#e74c3c';
            e.currentTarget.style.backgroundColor = '#fee';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#999';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          title={`Report this ${getContentTypeLabel()}`}
        >
          🚩
        </button>

        {showModal && (
          <ReportModal
            contentType={contentType}
            contentId={contentId}
            authorId={authorId}
            onClose={handleCloseModal}
            onSubmit={handleReportSubmitted}
          />
        )}
      </>
    );
  }

  // Text button variant
  return (
    <>
      <button
        onClick={handleOpenModal}
        className={`report-button ${className}`}
        style={{
          padding: size === 'small' ? '6px 12px' : '8px 16px',
          backgroundColor: 'transparent',
          border: '1px solid #ddd',
          borderRadius: '4px',
          cursor: 'pointer',
          color: '#666',
          fontSize: size === 'small' ? '12px' : '14px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#fee';
          e.currentTarget.style.borderColor = '#e74c3c';
          e.currentTarget.style.color = '#e74c3c';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.borderColor = '#ddd';
          e.currentTarget.style.color = '#666';
        }}
      >
        <span>🚩</span>
        {size !== 'small' && <span>Report</span>}
      </button>

      {showModal && (
        <ReportModal
          contentType={contentType}
          contentId={contentId}
          authorId={authorId}
          onClose={handleCloseModal}
          onSubmit={handleReportSubmitted}
        />
      )}
    </>
  );
};

export default ReportButton;