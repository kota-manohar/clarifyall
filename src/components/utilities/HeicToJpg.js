import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import heic2any from 'heic2any';
import { Download, Image as ImageIcon, Upload, Zap, Shield, CheckCircle, Smartphone } from 'lucide-react';
import '../../styles/Utilities.css';

const HeicToJpg = () => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [convertedUrl, setConvertedUrl] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [stats, setStats] = useState({ originalSize: 0, newSize: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && (droppedFile.name.toLowerCase().endsWith('.heic') || droppedFile.name.toLowerCase().endsWith('.heif'))) {
            handleFileSelect(droppedFile);
        }
    };

    const handleFileInput = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            handleFileSelect(selectedFile);
        }
    };

    const handleFileSelect = async (selectedFile) => {
        setFile(selectedFile);
        setError(null);
        setStats({ originalSize: selectedFile.size, newSize: 0 });
        setIsProcessing(true);

        try {
            // Convert HEIC to JPEG
            const convertedBlob = await heic2any({
                blob: selectedFile,
                toType: 'image/jpeg',
                quality: 0.92
            });

            // Handle if result is an array
            const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;

            const url = URL.createObjectURL(blob);
            setConvertedUrl(url);
            setPreview(url);
            setStats(prev => ({ ...prev, newSize: blob.size }));
            setIsProcessing(false);
        } catch (err) {
            console.error('Conversion error:', err);
            setError('Failed to convert HEIC file. Please ensure it\'s a valid HEIC/HEIF image.');
            setIsProcessing(false);
        }
    };

    const formatSize = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const resetConverter = () => {
        setFile(null);
        setPreview(null);
        setConvertedUrl(null);
        setStats({ originalSize: 0, newSize: 0 });
        setIsProcessing(false);
        setError(null);
    };

    return (
        <div className="converter-page">
            <Helmet>
                <title>Free HEIC to JPG Converter - Convert iPhone Photos to JPEG | ClarifyAll</title>
                <meta name="description" content="Convert HEIC/HEIF images from iPhone to JPG format online for free. Fast, secure conversion. Make iPhone photos compatible with all devices." />
                <meta name="keywords" content="heic to jpg, heic to jpeg, convert heic, iphone photos, heic converter, heif to jpg, heic to jpg online, free heic converter" />
                <meta property="og:title" content="Free HEIC to JPG Converter - Convert iPhone Photos to JPEG" />
                <meta property="og:description" content="Convert HEIC images to JPG instantly. Make iPhone photos work everywhere." />
                <meta property="og:type" content="website" />
                <link rel="canonical" href="https://clarifyall.com/tools/heic-to-jpg" />
            </Helmet>

            <div className="converter-container">
                <div className="converter-header">
                    <h1>Convert HEIC to JPG</h1>
                    <p>Transform iPhone HEIC photos to JPG format. Make your images compatible with all devices. Fast, secure, and free.</p>
                </div>

                {!file ? (
                    <div className="converter-card">
                        <div
                            className={`upload-zone ${isDragging ? 'dragging' : ''}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => document.getElementById('heic-input').click()}
                        >
                            <div className="upload-icon-wrapper">
                                <Upload size={32} />
                            </div>
                            <p className="upload-title">Drop your HEIC file here</p>
                            <p className="upload-subtitle">or click to browse • HEIC/HEIF format • Max 20MB</p>
                            <input
                                id="heic-input"
                                type="file"
                                accept=".heic,.heif,image/heic,image/heif"
                                onChange={handleFileInput}
                                style={{ display: 'none' }}
                            />
                        </div>
                        <button className="convert-button" disabled>
                            <ImageIcon size={20} />
                            Convert to JPG
                        </button>
                    </div>
                ) : (
                    <div className="converter-card">
                        <div className="file-display">
                            <div className="file-icon-wrapper">
                                <ImageIcon size={24} />
                            </div>
                            <div className="file-info">
                                <p className="file-name">{file.name}</p>
                                <p className="file-size">{formatSize(stats.originalSize)}</p>
                            </div>
                        </div>

                        {error && (
                            <div className="error-message">
                                {error}
                            </div>
                        )}

                        {convertedUrl && !error && (
                            <>
                                <div className="success-message">
                                    <CheckCircle size={20} />
                                    Conversion complete! iPhone photo now compatible with all devices.
                                </div>

                                <div className="image-preview-grid">
                                    <div className="preview-item">
                                        <p className="preview-label">Converted JPG</p>
                                        <img src={convertedUrl} alt="Converted" className="preview-img" />
                                        <p className="preview-size success">{formatSize(stats.newSize)}</p>
                                    </div>
                                </div>
                            </>
                        )}

                        {isProcessing && (
                            <div className="processing-message">Converting HEIC to JPG...</div>
                        )}

                        {convertedUrl && !error && (
                            <a
                                href={convertedUrl}
                                download={`${file.name.replace(/\.(heic|heif)$/i, '')}.jpg`}
                                className="convert-button"
                            >
                                <Download size={20} />
                                Download JPG
                            </a>
                        )}

                        <button className="secondary-button" onClick={resetConverter}>
                            Convert Another HEIC
                        </button>
                    </div>
                )}

                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">
                            <Smartphone size={24} />
                        </div>
                        <h3>iPhone Compatible</h3>
                        <p>Convert HEIC photos from iPhone and iPad to universal JPG format.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <Zap size={24} />
                        </div>
                        <h3>Instant Conversion</h3>
                        <p>Convert HEIC to JPG in seconds. No waiting, no hassle.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <Shield size={24} />
                        </div>
                        <h3>100% Private</h3>
                        <p>All conversion happens in your browser. Photos never leave your device.</p>
                    </div>
                </div>

                <div className="how-it-works">
                    <h2>How It Works</h2>
                    <div className="steps-grid">
                        <div className="step">
                            <div className="step-number">1</div>
                            <p>Upload your HEIC photo</p>
                        </div>
                        <div className="step">
                            <div className="step-number">2</div>
                            <p>We convert to JPG</p>
                        </div>
                        <div className="step">
                            <div className="step-number">3</div>
                            <p>Download compatible image</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HeicToJpg;
