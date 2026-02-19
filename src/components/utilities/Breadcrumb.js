import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const Breadcrumb = ({ items }) => {
    return (
        <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link to="/" className="flex items-center gap-1">
                <Home size={16} />
                <span>Home</span>
            </Link>
            {items.map((item, index) => (
                <React.Fragment key={index}>
                    <ChevronRight size={16} className="breadcrumb-separator" />
                    {item.href ? (
                        <Link to={item.href}>{item.label}</Link>
                    ) : (
                        <span className="text-gray-900 font-medium">{item.label}</span>
                    )}
                </React.Fragment>
            ))}
        </nav>
    );
};

export default Breadcrumb;
