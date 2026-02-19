import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import imageCompression from 'browser-image-compression';
import { Download, Upload, Zap, CheckCircle, Image as ImageIcon, Minimize2 } from 'lucide-react';
import '../../styles/Utilities.css';

const ImageCompressor = () => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [compressedUrl, setCompressedUrl] = useState(null);
    const [quality, setQuality] = useState(80);
    const [isProcessing, setIsProcessing] = useState(false);
    const [stats, setStats] = useState({ originalSize: 0, compressedSize: 0 });
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
        setStats({ originalSize: selectedFile.size, compressedSize: 0 });
        const url = URL.createObjectURL(selectedFile);
        setPreview(url);
        setCompressedUrl(null);
    };

    const compressImage = async () => {
        if (!file) return;

        setIsProcessing(true);

        try {
            const options = {
                maxSizeMB: 10,
                maxWidthOrHeight: 4096,
                useWebWorker: true,
                initialQuality: quality / 100
            };

            const compressedFile = await imageCompression(file, options);
            const url = URL.createObjectURL(compressedFile);
            setCompressedUrl(url);
            setStats(prev => ({ ...prev, compressedSize: compressedFile.size }));
            setIsProcessing(false);
        } catch (error) {
            console.error('Compression error:', error);
            setIsProcessing(false);
            alert('Failed to compress image. Please try again.');
        }
    };

    const formatSize = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getSavings = () => {
        if (!stats.originalSize || !stats.compressedSize) return 0;
        return Math.round(((stats.originalSize - stats.compressedSize) / stats.originalSize) * 100);
    };

    const reset = () => {
        setFile(null);
        setPreview(null);
        setCompressedUrl(null);
        setStats({ originalSize: 0, compressedSize: 0 });
        setQuality(80);
    };

    return (
        <div className="converter-page">
            <Helmet>
                <title>Free Image Compressor - Reduce Image Size Online | ClarifyAll</title>
                <meta name="description" content="Compress images online for free. Reduce JPG, PNG, WebP file size. Adjustable quality. Fast compression. No file size limits." />
                <meta name="keywords" content="image compressor, compress image, reduce image size, image optimizer, compress jpg, compress png, image compression online" />
                <meta property="og:title" content="Free Image Compressor - Reduce Image Size" />
                <meta property="og:description" content="Compress images instantly. Reduce file size while maintaining quality." />
                <link rel="canonical" href="https://clarifyall.com/tools/image-compressor" />
            </Helmet>

            <div className="converter-container">
                <div className="converter-header">
                    <h1>Image Compressor</h1>
                    <p>Reduce image file size while maintaining quality. Perfect for web and email.</p>
                </div>

                {!file ? (
                    <div className="converter-card">
                        <div
                            className={`upload-zone ${isDragging ? 'dragging' : ''}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => document.getElementById('compress-input').click()}
                        >
                            <div className="upload-icon-wrapper">
                                <Upload size={32} />
                            </div>
                            <p className="upload-title">Drop your image here</p>
                            <p className="upload-subtitle">or click to browse • JPG, PNG, WebP</p>
                            <input
                                id="compress-input"
                                type="file"
                                accept="image/*"
                                onChange={handleFileInput}
                                style={{ display: 'none' }}
                            />
                        </div>
                        <button className="convert-button" disabled>
                            <Minimize2 size={20} />
                            Compress Image
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

                        {!compressedUrl && (
                            <div className="quality-control">
                                <label className="quality-label">
                                    Compression Quality: {quality}%
                                </label>
                                <input
                                    type="range"
                                    min="10"
                                    max="100"
                                    value={quality}
                                    onChange={(e) => setQuality(Number(e.target.value))}
                                    className="quality-slider"
                                />
                                <div className="quality-hints">
                                    <span>Smaller file</span>
                                    <span>Better quality</span>
                                </div>
                            </div>
                        )}

                        {compressedUrl && (
                            <>
                                <div className="success-message">
                                    <CheckCircle size={20} />
                                    Image compressed by {getSavings()}%!
                                </div>

                                <div className="compression-stats">
                                    <div className="stat-item">
                                        <p className="stat-label">Original</p>
                                        <p className="stat-value">{formatSize(stats.originalSize)}</p>
                                    </div>
                                    <div className="stat-divider">→</div>
                                    <div className="stat-item">
                                        <p className="stat-label">Compressed</p>
                                        <p className="stat-value success">{formatSize(stats.compressedSize)}</p>
                                    </div>
                                </div>

                                <div className="image-preview-grid">
                                    <div className="preview-item">
                                        <p className="preview-label">Original</p>
                                        <img src={preview} alt="Original" className="preview-img" />
                                    </div>
                                    <div className="preview-item">
                                        <p className="preview-label">Compressed</p>
                                        <img src={compressedUrl} alt="Compressed" className="preview-img" />
                                    </div>
                                </div>
                            </>
                        )}

                        {isProcessing && (
                            <div className="processing-message">Compressing image...</div>
                        )}

                        {!compressedUrl && !isProcessing && (
                            <button onClick={compressImage} className="convert-button">
                                <Minimize2 size={20} />
                                Compress Image
                            </button>
                        )}

                        {compressedUrl && (
                            <a
                                href={compressedUrl}
                                download={`compressed_${file.name}`}
                                className="convert-button"
                            >
                                <Download size={20} />
                                Download Compressed Image
                            </a>
                        )}

                        <button className="secondary-button" onClick={reset}>
                            Compress Another Image
                        </button>
                    </div>
                )}

                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">
                            <Minimize2 size={24} />
                        </div>
                        <h3>Reduce File Size</h3>
                        <p>Compress images up to 90% smaller for faster websites and emails.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <Zap size={24} />
                        </div>
                        <h3>Adjustable Quality</h3>
                        <p>Control compression quality with an easy-to-use slider.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <ImageIcon size={24} />
                        </div>
                        <h3>Preview Comparison</h3>
                        <p>See before and after images side by side to ensure quality.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageCompressor;
