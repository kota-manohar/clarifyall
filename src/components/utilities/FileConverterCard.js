import React from 'react';
import { Link } from 'react-router-dom';

const FileConverterCard = ({ title, description, icon: Icon, url, badge }) => {
    return (
        <Link to={url} className="tool-card">
            <div className="tool-card-icon">
                <Icon size={24} strokeWidth={2} />
            </div>
            <h3 className="tool-card-title">{title}</h3>
            <p className="tool-card-description">{description}</p>
            {badge && (
                <span className="tool-card-badge">{badge}</span>
            )}
        </Link>
    );
};

export default FileConverterCard;
