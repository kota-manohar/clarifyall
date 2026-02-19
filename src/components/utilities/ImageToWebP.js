import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Download, Image as ImageIcon, Upload, Zap, Shield, CheckCircle, Minimize } from 'lucide-react';
import '../../styles/Utilities.css';

const ImageToWebP = () => {
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
        if (droppedFile && droppedFile.type.startsWith('image/')) {
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
                }, 'image/webp', 0.8);
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
    };

    return (
        <div className="converter-page">
            <Helmet>
                <title>Free Image to WebP Converter - Convert JPG/PNG to WebP Online | ClarifyAll</title>
                <meta name="description" content="Convert JPG, PNG to WebP format online for free. Reduce image size by 25-34%. Optimize images for faster websites and better SEO. Client-side processing, 100% secure." />
                <meta name="keywords" content="image to webp, jpg to webp, png to webp, convert image to webp, webp converter, image optimizer, compress images, webp format, image converter online, free image converter" />
                <meta property="og:title" content="Free Image to WebP Converter - Convert JPG/PNG to WebP Online" />
                <meta property="og:description" content="Convert images to WebP format for faster websites. Reduce file size by up to 34%." />
                <meta property="og:type" content="website" />
                <link rel="canonical" href="https://clarifyall.com/tools/image-to-webp" />
            </Helmet>

            <div className="converter-container">
                <div className="converter-header">
                    <h1>Convert Image to WebP</h1>
                    <p>Compress images for faster websites. Convert JPG and PNG to modern WebP format. Fast, secure, and free.</p>
                </div>

                {!file ? (
                    <div className="converter-card">
                        <div
                            className={`upload-zone ${isDragging ? 'dragging' : ''}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => document.getElementById('image-input').click()}
                        >
                            <div className="upload-icon-wrapper">
                                <Upload size={32} />
                            </div>
                            <p className="upload-title">Drop your image here</p>
                            <p className="upload-subtitle">or click to browse • JPG, PNG • Max 10MB</p>
                            <input
                                id="image-input"
                                type="file"
                                accept="image/png, image/jpeg, image/jpg"
                                onChange={handleFileInput}
                                style={{ display: 'none' }}
                            />
                        </div>
                        <button className="convert-button" disabled>
                            <ImageIcon size={20} />
                            Convert to WebP
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
                                    Conversion complete! Saved {getSavings()}% in file size.
                                </div>

                                <div className="image-preview-grid">
                                    <div className="preview-item">
                                        <p className="preview-label">Original</p>
                                        <img src={preview} alt="Original" className="preview-img" />
                                        <p className="preview-size">{formatSize(stats.originalSize)}</p>
                                    </div>
                                    <div className="preview-item">
                                        <p className="preview-label">WebP Optimized</p>
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
                            download={`${file.name.split('.')[0]}.webp`}
                            className={`convert-button ${!convertedUrl ? 'disabled' : ''}`}
                            style={{ pointerEvents: !convertedUrl ? 'none' : 'auto' }}
                        >
                            <Download size={20} />
                            Download WebP
                        </a>

                        <button className="secondary-button" onClick={resetConverter}>
                            Convert Another Image
                        </button>
                    </div>
                )}

                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">
                            <Minimize size={24} />
                        </div>
                        <h3>Smaller Files</h3>
                        <p>WebP images are 25-34% smaller than JPG and PNG with no quality loss.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <Zap size={24} />
                        </div>
                        <h3>Faster Websites</h3>
                        <p>Smaller images mean faster page load times and better SEO rankings.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <Shield size={24} />
                        </div>
                        <h3>100% Private</h3>
                        <p>All conversion happens in your browser. Your images never leave your device.</p>
                    </div>
                </div>

                <div className="how-it-works">
                    <h2>How It Works</h2>
                    <div className="steps-grid">
                        <div className="step">
                            <div className="step-number">1</div>
                            <p>Upload your image</p>
                        </div>
                        <div className="step">
                            <div className="step-number">2</div>
                            <p>We convert to WebP</p>
                        </div>
                        <div className="step">
                            <div className="step-number">3</div>
                            <p>Download optimized image</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageToWebP;
