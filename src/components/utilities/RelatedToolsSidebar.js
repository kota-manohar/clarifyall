import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { getTools } from '../../services/toolService';

const RelatedToolsSidebar = ({ categoryTag }) => {
    const [tools, setTools] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRelated = async () => {
            try {
                // Fetch tools, we'll just get the latest or popular ones for now
                // In a real app, you'd filter by categoryTag if possible
                const response = await getTools({ size: 5, sort: 'popular' });
                if (response && response.tools) {
                    setTools(response.tools.slice(0, 5));
                }
            } catch (error) {
                console.error('Failed to load related tools', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRelated();
    }, [categoryTag]);

    if (loading) return <div className="animate-pulse h-64 bg-gray-100 rounded-xl"></div>;

    return (
        <aside className="sidebar-widget">
            <h3>Popular AI Tools</h3>
            <div className="flex flex-col gap-2">
                {tools.map(tool => (
                    <Link
                        key={tool.id}
                        to={`/tool/${tool.slug || tool.id}`}
                        className="related-tool-item group"
                    >
                        <img
                            src={tool.logo_url || tool.logoUrl}
                            alt={tool.name}
                            className="related-tool-icon"
                        />
                        <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm text-gray-900 truncate group-hover:text-blue-600">
                                {tool.name}
                            </h4>
                            <div className="flex items-center gap-1 text-xs text-orange-500">
                                <Star size={12} fill="currentColor" />
                                <span>{tool.rating ? tool.rating.toFixed(1) : 'New'}</span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
            <Link
                to="/"
                className="block mt-4 text-center text-sm text-blue-600 font-medium hover:underline"
            >
                View All Tools →
            </Link>
        </aside>
    );
};

export default RelatedToolsSidebar;
