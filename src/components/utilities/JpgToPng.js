import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Download, Image as ImageIcon, Upload, Zap, Shield, CheckCircle } from 'lucide-react';
import '../../styles/Utilities.css';

const JpgToPng = () => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [convertedUrl, setConvertedUrl] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [stats, setStats] = useState({ originalSize: 0, newSize: 0 });
    const [isDragging, setIsDragging] = useState(false);

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
        if (droppedFile && (droppedFile.type === 'image/jpeg' || droppedFile.type === 'image/jpg')) {
            handleFileSelect(droppedFile);
        }
    };

    const handleFileInput = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            handleFileSelect(selectedFile);
        }
    };

    const handleFileSelect = (selectedFile) => {
        setFile(selectedFile);
        setPreview(URL.createObjectURL(selectedFile));
        setConvertedUrl(null);
        setStats({ originalSize: selectedFile.size, newSize: 0 });
        convertImage(selectedFile);
    };

    const convertImage = (imageFile) => {
        setIsProcessing(true);
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);

                canvas.toBlob((blob) => {
                    if (blob) {
                        const url = URL.createObjectURL(blob);
                        setConvertedUrl(url);
                        setStats(prev => ({ ...prev, newSize: blob.size }));
                        setIsProcessing(false);
                    }
                }, 'image/png');
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(imageFile);
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
    };

    return (
        <div className="converter-page">
            <Helmet>
                <title>Free JPG to PNG Converter - Convert JPEG to PNG Online | ClarifyAll</title>
                <meta name="description" content="Convert JPG/JPEG images to PNG format online for free. Add transparency support and lossless quality. Fast, secure, client-side conversion." />
                <meta name="keywords" content="jpg to png, jpeg to png, convert jpg to png, jpg converter, image converter, jpg to png online, free jpg converter, add transparency" />
                <meta property="og:title" content="Free JPG to PNG Converter - Convert JPEG to PNG Online" />
                <meta property="og:description" content="Convert JPG images to PNG format instantly. Support transparency and lossless quality." />
                <meta property="og:type" content="website" />
                <link rel="canonical" href="https://clarifyall.com/tools/jpg-to-png" />
            </Helmet>

            <div className="converter-container">
                <div className="converter-header">
                    <h1>Convert JPG to PNG</h1>
                    <p>Transform JPG images to PNG format. Enable transparency support. Fast, secure, and free.</p>
                </div>

                {!file ? (
                    <div className="converter-card">
                        <div
                            className={`upload-zone ${isDragging ? 'dragging' : ''}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => document.getElementById('jpg-input').click()}
                        >
                            <div className="upload-icon-wrapper">
                                <Upload size={32} />
                            </div>
                            <p className="upload-title">Drop your JPG here</p>
                            <p className="upload-subtitle">or click to browse • JPG/JPEG format • Max 10MB</p>
                            <input
                                id="jpg-input"
                                type="file"
                                accept="image/jpeg,image/jpg"
                                onChange={handleFileInput}
                                style={{ display: 'none' }}
                            />
                        </div>
                        <button className="convert-button" disabled>
                            <ImageIcon size={20} />
                            Convert to PNG
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

                        {convertedUrl && (
                            <>
                                <div className="success-message">
                                    <CheckCircle size={20} />
                                    Conversion complete! PNG format with transparency support.
                                </div>

                                <div className="image-preview-grid">
                                    <div className="preview-item">
                                        <p className="preview-label">Original JPG</p>
                                        <img src={preview} alt="Original" className="preview-img" />
                                        <p className="preview-size">{formatSize(stats.originalSize)}</p>
                                    </div>
                                    <div className="preview-item">
                                        <p className="preview-label">Converted PNG</p>
                                        <img src={convertedUrl} alt="Converted" className="preview-img" />
                                        <p className="preview-size success">{formatSize(stats.newSize)}</p>
                                    </div>
                                </div>
                            </>
                        )}

                        {isProcessing && (
                            <div className="processing-message">Converting...</div>
                        )}

                        <a
                            href={convertedUrl}
                            download={`${file.name.replace(/\.(jpg|jpeg)$/i, '')}.png`}
                            className={`convert-button ${!convertedUrl ? 'disabled' : ''}`}
                            style={{ pointerEvents: !convertedUrl ? 'none' : 'auto' }}
                        >
                            <Download size={20} />
                            Download PNG
                        </a>

                        <button className="secondary-button" onClick={resetConverter}>
                            Convert Another JPG
                        </button>
                    </div>
                )}

                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">
                            <Shield size={24} />
                        </div>
                        <h3>Transparency Support</h3>
                        <p>PNG format supports transparent backgrounds, perfect for logos and graphics.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <Zap size={24} />
                        </div>
                        <h3>Lossless Quality</h3>
                        <p>PNG preserves image quality without compression artifacts.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <CheckCircle size={24} />
                        </div>
                        <h3>100% Private</h3>
                        <p>All conversion happens in your browser. Images never leave your device.</p>
                    </div>
                </div>

                <div className="how-it-works">
                    <h2>How It Works</h2>
                    <div className="steps-grid">
                        <div className="step">
                            <div className="step-number">1</div>
                            <p>Upload your JPG image</p>
                        </div>
                        <div className="step">
                            <div className="step-number">2</div>
                            <p>We convert to PNG</p>
                        </div>
                        <div className="step">
                            <div className="step-number">3</div>
                            <p>Download your PNG</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JpgToPng;
