import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Download, Image as ImageIcon, Upload, Zap, Shield, CheckCircle, Maximize2 } from 'lucide-react';
import '../../styles/Utilities.css';

const ImageResizer = () => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [convertedUrl, setConvertedUrl] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [dimensions, setDimensions] = useState({ width: '', height: '', originalWidth: 0, originalHeight: 0 });
    const [maintainAspect, setMaintainAspect] = useState(true);
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
        const previewUrl = URL.createObjectURL(selectedFile);
        setPreview(previewUrl);

        // Get image dimensions
        const img = new Image();
        img.onload = () => {
            setDimensions({
                width: img.width,
                height: img.height,
                originalWidth: img.width,
                originalHeight: img.height
            });
        };
        img.src = previewUrl;
    };

    const handleWidthChange = (e) => {
        const newWidth = parseInt(e.target.value) || '';
        if (maintainAspect && dimensions.originalHeight) {
            const aspectRatio = dimensions.originalHeight / dimensions.originalWidth;
            setDimensions(prev => ({
                ...prev,
                width: newWidth,
                height: Math.round(newWidth * aspectRatio)
            }));
        } else {
            setDimensions(prev => ({ ...prev, width: newWidth }));
        }
    };

    const handleHeightChange = (e) => {
        const newHeight = parseInt(e.target.value) || '';
        if (maintainAspect && dimensions.originalWidth) {
            const aspectRatio = dimensions.originalWidth / dimensions.originalHeight;
            setDimensions(prev => ({
                ...prev,
                height: newHeight,
                width: Math.round(newHeight * aspectRatio)
            }));
        } else {
            setDimensions(prev => ({ ...prev, height: newHeight }));
        }
    };

    const resizeImage = () => {
        if (!file || !dimensions.width || !dimensions.height) return;

        setIsProcessing(true);
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = dimensions.width;
                canvas.height = dimensions.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);

                const fileType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
                canvas.toBlob((blob) => {
                    if (blob) {
                        const url = URL.createObjectURL(blob);
                        setConvertedUrl(url);
                        setIsProcessing(false);
                    }
                }, fileType, quality);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    const resetConverter = () => {
        setFile(null);
        setPreview(null);
        setConvertedUrl(null);
        setDimensions({ width: '', height: '', originalWidth: 0, originalHeight: 0 });
        setIsProcessing(false);
        setMaintainAspect(true);
    };

    return (
        <div className="converter-page">
            <Helmet>
                <title>Free Image Resizer - Resize Images Online | ClarifyAll</title>
                <meta name="description" content="Resize images online for free. Adjust width and height while maintaining aspect ratio. Support for JPG, PNG, WebP. Fast, secure, client-side processing." />
                <meta name="keywords" content="image resizer, resize image, image dimensions, scale image, resize photo, image resizer online, free image resizer, resize jpg, resize png" />
                <meta property="og:title" content="Free Image Resizer - Resize Images Online" />
                <meta property="og:description" content="Resize images instantly. Adjust dimensions while maintaining quality." />
                <meta property="og:type" content="website" />
                <link rel="canonical" href="https://clarifyall.com/tools/image-resizer" />
            </Helmet>

            <div className="converter-container">
                <div className="converter-header">
                    <h1>Resize Images Online</h1>
                    <p>Adjust image dimensions easily. Maintain aspect ratio or set custom sizes. Fast, secure, and free.</p>
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
                            <p className="upload-subtitle">or click to browse • JPG, PNG, WebP • Max 10MB</p>
                            <input
                                id="image-input"
                                type="file"
                                accept="image/*"
                                onChange={handleFileInput}
                                style={{ display: 'none' }}
                            />
                        </div>
                        <button className="convert-button" disabled>
                            <Maximize2 size={20} />
                            Resize Image
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
                                <p className="file-size">{dimensions.originalWidth} × {dimensions.originalHeight}px</p>
                            </div>
                        </div>

                        <div className="resize-controls">
                            <div className="dimension-inputs">
                                <div className="input-group">
                                    <label>Width (px)</label>
                                    <input
                                        type="number"
                                        value={dimensions.width}
                                        onChange={handleWidthChange}
                                        placeholder="Width"
                                        min="1"
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Height (px)</label>
                                    <input
                                        type="number"
                                        value={dimensions.height}
                                        onChange={handleHeightChange}
                                        placeholder="Height"
                                        min="1"
                                    />
                                </div>
                            </div>
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={maintainAspect}
                                    onChange={(e) => setMaintainAspect(e.target.checked)}
                                />
                                <span>Maintain aspect ratio</span>
                            </label>
                        </div>

                        {convertedUrl && (
                            <>
                                <div className="success-message">
                                    <CheckCircle size={20} />
                                    Image resized to {dimensions.width} × {dimensions.height}px!
                                </div>

                                <div className="image-preview-grid">
                                    <div className="preview-item">
                                        <p className="preview-label">Original ({dimensions.originalWidth}×{dimensions.originalHeight})</p>
                                        <img src={preview} alt="Original" className="preview-img" />
                                    </div>
                                    <div className="preview-item">
                                        <p className="preview-label">Resized ({dimensions.width}×{dimensions.height})</p>
                                        <img src={convertedUrl} alt="Resized" className="preview-img" />
                                    </div>
                                </div>
                            </>
                        )}

                        {isProcessing && (
                            <div className="processing-message">Resizing image...</div>
                        )}

                        <button
                            onClick={resizeImage}
                            className="convert-button"
                            disabled={!dimensions.width || !dimensions.height || isProcessing}
                        >
                            <Maximize2 size={20} />
                            {isProcessing ? 'Resizing...' : 'Resize Image'}
                        </button>

                        {convertedUrl && (
                            <a
                                href={convertedUrl}
                                download={`resized_${file.name}`}
                                className="convert-button"
                            >
                                <Download size={20} />
                                Download Resized Image
                            </a>
                        )}

                        <button className="secondary-button" onClick={resetConverter}>
                            Resize Another Image
                        </button>
                    </div>
                )}

                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">
                            <Maximize2 size={24} />
                        </div>
                        <h3>Custom Dimensions</h3>
                        <p>Set exact width and height or maintain aspect ratio automatically.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <Zap size={24} />
                        </div>
                        <h3>Instant Resize</h3>
                        <p>Resize images in seconds with high-quality output.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <Shield size={24} />
                        </div>
                        <h3>100% Private</h3>
                        <p>All processing happens in your browser. Images never leave your device.</p>
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
                            <p>Set new dimensions</p>
                        </div>
                        <div className="step">
                            <div className="step-number">3</div>
                            <p>Download resized image</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageResizer;
