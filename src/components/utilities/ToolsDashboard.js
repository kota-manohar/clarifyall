import React, { useState, useMemo } from 'react';
import {
    FileJson,
    FileText,
    Image,
    Scissors,
    Wand2,
    Search,
    Type,
    Shield
} from 'lucide-react';
import SEO from '../SEO';
import FileConverterCard from './FileConverterCard';
import '../../styles/Utilities.css';

const TOOLS = [
    {
        id: 'pdf-to-word',
        title: 'PDF to Word',
        description: 'Convert PDF documents to editable Word files instantly.',
        icon: FileText,
        url: '/tools/pdf-to-word',
        category: 'Document',
        popular: true
    },
    {
        id: 'word-to-pdf',
        title: 'Word to PDF',
        description: 'Convert Word documents to PDF files instantly.',
        icon: FileText,
        url: '/tools/word-to-pdf',
        category: 'Document',
        popular: true
    },
    {
        id: 'json-to-excel',
        title: 'JSON to Excel',
        description: 'Transform JSON data into Excel spreadsheets for analysis.',
        icon: FileJson,
        url: '/tools/json-to-excel',
        category: 'Data',
        badge: 'Popular'
    },
    {
        id: 'image-to-webp',
        title: 'Image to WebP',
        description: 'Compress images to WebP format for faster websites.',
        icon: Image,
        url: '/tools/image-to-webp',
        category: 'Image',
        popular: true
    },
    {
        id: 'png-to-jpg',
        title: 'PNG to JPG',
        description: 'Convert PNG images to JPG format with adjustable quality.',
        icon: Image,
        url: '/tools/png-to-jpg',
        category: 'Image',
        popular: false
    },
    {
        id: 'jpg-to-png',
        title: 'JPG to PNG',
        description: 'Convert JPG to PNG format with transparency support.',
        icon: Image,
        url: '/tools/jpg-to-png',
        category: 'Image',
        popular: false
    },
    {
        id: 'image-resizer',
        title: 'Image Resizer',
        description: 'Resize images to custom dimensions easily.',
        icon: Image,
        url: '/tools/image-resizer',
        category: 'Image',
        badge: 'New'
    },
    {
        id: 'csv-to-excel',
        title: 'CSV to Excel',
        description: 'Convert CSV files to Excel spreadsheets instantly.',
        icon: FileJson,
        url: '/tools/csv-to-excel',
        category: 'Data',
        popular: false
    },
    {
        id: 'excel-to-csv',
        title: 'Excel to CSV',
        description: 'Export Excel data to CSV format with sheet selection.',
        icon: FileText,
        url: '/tools/excel-to-csv',
        category: 'Data',
        popular: false
    },
    {
        id: 'heic-to-jpg',
        title: 'HEIC to JPG',
        description: 'Convert iPhone HEIC photos to JPG format for compatibility.',
        icon: Image,
        url: '/tools/heic-to-jpg',
        category: 'Image',
        badge: 'Popular'
    },
    {
        id: 'pdf-compressor',
        title: 'PDF Compressor',
        description: 'Reduce PDF file size while maintaining quality.',
        icon: FileText,
        url: '/tools/pdf-compressor',
        category: 'Document',
        popular: false
    },
    {
        id: 'pdf-merger',
        title: 'PDF Merger',
        description: 'Combine multiple PDF files into a single document.',
        icon: FileText,
        url: '/tools/pdf-merger',
        category: 'Document',
        badge: 'New'
    },
    {
        id: 'pdf-splitter',
        title: 'PDF Splitter',
        description: 'Extract individual pages from PDF documents.',
        icon: FileText,
        url: '/tools/pdf-splitter',
        category: 'Document',
        popular: false
    },
    {
        id: 'base64',
        title: 'Base64 Encoder/Decoder',
        description: 'Convert files to Base64 or decode Base64 strings.',
        icon: FileJson,
        url: '/tools/base64',
        category: 'Utilities',
        popular: false
    },
    {
        id: 'hash-generator',
        title: 'Hash Generator',
        description: 'Generate SHA-1, SHA-256, SHA-384, SHA-512 hashes.',
        icon: FileText,
        url: '/tools/hash-generator',
        category: 'Utilities',
        badge: 'New'
    },
    {
        id: 'image-rotation',
        title: 'Image Rotation',
        description: 'Rotate and flip images easily online.',
        icon: Image,
        url: '/tools/image-rotation',
        category: 'Image',
        popular: false
    },
    {
        id: 'text-to-pdf',
        title: 'Text to PDF',
        description: 'Convert plain text to PDF documents.',
        icon: FileText,
        url: '/tools/text-to-pdf',
        category: 'Document',
        popular: false
    },
    {
        id: 'image-compressor',
        title: 'Image Compressor',
        description: 'Reduce image file size while maintaining quality.',
        icon: Image,
        url: '/tools/image-compressor',
        category: 'Image',
        badge: 'Popular'
    },
    {
        id: 'qr-code-generator',
        title: 'QR Code Generator',
        description: 'Create QR codes from text or URLs instantly.',
        icon: FileJson,
        url: '/tools/qr-code-generator',
        category: 'Utilities',
        badge: 'Popular'
    },
    {
        id: 'json-formatter',
        title: 'JSON Formatter',
        description: 'Beautify, minify, and validate JSON with syntax checking.',
        icon: FileJson,
        url: '/tools/json-formatter',
        category: 'Data',
        badge: 'New'
    },
    {
        id: 'password-generator',
        title: 'Password Generator',
        description: 'Generate strong, secure passwords with custom options.',
        icon: Shield,
        url: '/tools/password-generator',
        category: 'Utilities',
        badge: 'New'
    },
    {
        id: 'word-counter',
        title: 'Word Counter',
        description: 'Count words, characters, sentences, and reading time.',
        icon: FileText,
        url: '/tools/word-counter',
        category: 'Utilities',
        badge: 'New'
    },
    {
        id: 'case-converter',
        title: 'Case Converter',
        description: 'Convert text to UPPER, lower, camelCase, and more.',
        icon: Type,
        url: '/tools/case-converter',
        category: 'Utilities',
        badge: 'New'
    },
    {
        id: 'text-diff',
        title: 'Text Diff / Compare',
        description: 'Compare two texts and highlight differences.',
        icon: FileText,
        url: '/tools/text-diff',
        category: 'Utilities',
        badge: 'New'
    },
    {
        id: 'favicon-generator',
        title: 'Favicon Generator',
        description: 'Generate favicons in multiple sizes from images.',
        icon: Image,
        url: '/tools/favicon-generator',
        category: 'Image',
        badge: 'New'
    },
    {
        id: 'ai-text-improver',
        title: 'AI Text Improver',
        description: 'Enhance your writing with AI-powered suggestions.',
        icon: Wand2,
        url: '#',
        category: 'AI',
        badge: 'Coming Soon'
    },
    {
        id: 'sitemap-generator',
        title: 'Sitemap Generator',
        description: 'Generate XML sitemaps for your website instantly.',
        icon: FileText,
        url: '/tools/sitemap-generator',
        category: 'Utilities',
        badge: 'New'
    },
    {
        id: 'video-trimmer',
        title: 'Video Trimmer',
        description: 'Quickly trim video files online.',
        icon: Scissors,
        url: '#',
        category: 'Video',
        badge: 'Coming Soon'
    }
];

const CATEGORIES = ['All', 'Document', 'Data', 'Image', 'AI', 'Video'];

const ToolsDashboard = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');

    const filteredTools = useMemo(() => {
        return TOOLS.filter(tool => {
            const matchesSearch = tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                tool.description.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = activeCategory === 'All' || tool.category === activeCategory;
            return matchesSearch && matchesCategory;
        });
    }, [searchQuery, activeCategory]);

    return (
        <div className="utilities-page">
            <SEO
                title="Free Online Utility Tools - PDF, JSON, Image Converters | ClarifyAll"
                description="Access free online tools for converting PDF to Word, JSON to Excel, and Images to WebP. Fast, secure, and client-side processing."
                keywords="online tools, pdf converter, json to excel, image converter, webp converter, free utilities"
                canonicalUrl="/tools"
            />

            <div className="category-hero">
                <div className="category-hero-content">
                    <h1>ClarifyAll Utilities</h1>
                    <p>Free, secure, and fast online tools for your daily tasks.</p>
                </div>
            </div>

            <div className="dashboard-header">
                <div className="dashboard-controls">
                    <div className="search-box">
                        <Search className="search-icon" size={20} />
                        <input
                            type="text"
                            placeholder="Search tools..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="filter-group">
                        {CATEGORIES.map(category => (
                            <button
                                key={category}
                                className={`filter-btn ${activeCategory === category ? 'active' : ''}`}
                                onClick={() => setActiveCategory(category)}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="tools-grid">
                {filteredTools.length > 0 ? (
                    filteredTools.map(tool => (
                        <FileConverterCard key={tool.id} {...tool} />
                    ))
                ) : (
                    <div className="col-span-full text-center py-12">
                        <p className="text-gray-500 text-lg">No tools found matching your criteria.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ToolsDashboard;
