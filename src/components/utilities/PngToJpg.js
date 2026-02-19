import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Download, Image as ImageIcon, Upload, Zap, Shield, CheckCircle, Minimize2 } from 'lucide-react';
import '../../styles/Utilities.css';

const PngToJpg = () => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [convertedUrl, setConvertedUrl] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [stats, setStats] = useState({ originalSize: 0, newSize: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [quality, setQuality] = useState(0.92);

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
        if (droppedFile && droppedFile.type === 'image/png') {
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
        convertImage(selectedFile, quality);
    };

    const convertImage = (imageFile, qual) => {
        setIsProcessing(true);
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');

                // Fill with white background (JPG doesn't support transparency)
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);

                canvas.toBlob((blob) => {
                    if (blob) {
                        const url = URL.createObjectURL(blob);
                        setConvertedUrl(url);
                        setStats(prev => ({ ...prev, newSize: blob.size }));
                        setIsProcessing(false);
                    }
                }, 'image/jpeg', qual);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(imageFile);
    };

    const handleQualityChange = (e) => {
        const newQuality = parseFloat(e.target.value);
        setQuality(newQuality);
        if (file) {
            convertImage(file, newQuality);
        }
    };

    const formatSize = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getSavings = () => {
        if (!stats.originalSize || !stats.newSize) return 0;
        return Math.round(((stats.originalSize - stats.newSize) / stats.originalSize) * 100);
    };

    const resetConverter = () => {
        setFile(null);
        setPreview(null);
        setConvertedUrl(null);
        setStats({ originalSize: 0, newSize: 0 });
        setIsProcessing(false);
        setQuality(0.92);
    };

    return (
        <div className="converter-page">
            <Helmet>
                <title>Free PNG to JPG Converter - Convert PNG to JPEG Online | ClarifyAll</title>
                <meta name="description" content="Convert PNG images to JPG format online for free. Reduce file size while maintaining quality. Fast, secure, client-side conversion. No upload required." />
                <meta name="keywords" content="png to jpg, png to jpeg, convert png to jpg, png converter, image converter, png to jpg online, free png converter, reduce image size" />
                <meta property="og:title" content="Free PNG to JPG Converter - Convert PNG to JPEG Online" />
                <meta property="og:description" content="Convert PNG images to JPG format instantly. Reduce file size and optimize for web." />
                <meta property="og:type" content="website" />
                <link rel="canonical" href="https://clarifyall.com/tools/png-to-jpg" />
            </Helmet>

            <div className="converter-container">
                <div className="converter-header">
                    <h1>Convert PNG to JPG</h1>
                    <p>Transform PNG images to JPG format. Reduce file size for faster loading. Fast, secure, and free.</p>
                </div>

                {!file ? (
                    <div className="converter-card">
                        <div
                            className={`upload-zone ${isDragging ? 'dragging' : ''}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => document.getElementById('png-input').click()}
                        >
                            <div className="upload-icon-wrapper">
                                <Upload size={32} />
                            </div>
                            <p className="upload-title">Drop your PNG here</p>
                            <p className="upload-subtitle">or click to browse • PNG format • Max 10MB</p>
                            <input
                                id="png-input"
                                type="file"
                                accept="image/png"
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

                        {convertedUrl && (
                            <>
                                <div className="success-message">
                                    <CheckCircle size={20} />
                                    Conversion complete! {getSavings() > 0 && `Reduced by ${getSavings()}%`}
                                </div>

                                <div className="quality-control">
                                    <label>Quality: {Math.round(quality * 100)}%</label>
                                    <input
                                        type="range"
                                        min="0.5"
                                        max="1"
                                        step="0.01"
                                        value={quality}
                                        onChange={handleQualityChange}
                                        className="quality-slider"
                                    />
                                </div>

                                <div className="image-preview-grid">
                                    <div className="preview-item">
                                        <p className="preview-label">Original PNG</p>
                                        <img src={preview} alt="Original" className="preview-img" />
                                        <p className="preview-size">{formatSize(stats.originalSize)}</p>
                                    </div>
                                    <div className="preview-item">
                                        <p className="preview-label">Converted JPG</p>
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
                            download={`${file.name.replace('.png', '')}.jpg`}
                            className={`convert-button ${!convertedUrl ? 'disabled' : ''}`}
                            style={{ pointerEvents: !convertedUrl ? 'none' : 'auto' }}
                        >
                            <Download size={20} />
                            Download JPG
                        </a>

                        <button className="secondary-button" onClick={resetConverter}>
                            Convert Another PNG
                        </button>
                    </div>
                )}

                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">
                            <Minimize2 size={24} />
                        </div>
                        <h3>Smaller Files</h3>
                        <p>JPG files are typically smaller than PNG, perfect for websites and emails.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <Zap size={24} />
                        </div>
                        <h3>Instant Conversion</h3>
                        <p>Convert PNG to JPG in seconds with adjustable quality settings.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <Shield size={24} />
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
                            <p>Upload your PNG image</p>
                        </div>
                        <div className="step">
                            <div className="step-number">2</div>
                            <p>Adjust quality if needed</p>
                        </div>
                        <div className="step">
                            <div className="step-number">3</div>
                            <p>Download your JPG</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PngToJpg;
