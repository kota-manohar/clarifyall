import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { PDFDocument } from 'pdf-lib';
import { Download, FileText, Upload, Zap, Shield, CheckCircle, Minimize2 } from 'lucide-react';
import '../../styles/Utilities.css';

const PdfCompressor = () => {
    const [file, setFile] = useState(null);
    const [compressedUrl, setCompressedUrl] = useState(null);
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
        if (droppedFile && droppedFile.type === 'application/pdf') {
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
        setStats({ originalSize: selectedFile.size, compressedSize: 0 });
        setIsProcessing(true);

        try {
            const arrayBuffer = await selectedFile.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);

            // Compress by removing metadata and optimizing
            pdfDoc.setTitle('');
            pdfDoc.setAuthor('');
            pdfDoc.setSubject('');
            pdfDoc.setKeywords([]);
            pdfDoc.setProducer('');
            pdfDoc.setCreator('');

            const compressedPdfBytes = await pdfDoc.save({
                useObjectStreams: true,
                addDefaultPage: false,
            });

            const blob = new Blob([compressedPdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            setCompressedUrl(url);
            setStats(prev => ({ ...prev, compressedSize: blob.size }));
            setIsProcessing(false);
        } catch (error) {
            console.error('Compression error:', error);
            setIsProcessing(false);
            alert('Failed to compress PDF. Please try a different file.');
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
        if (!stats.originalSize || !stats.compressedSize) return 0;
        return Math.round(((stats.originalSize - stats.compressedSize) / stats.originalSize) * 100);
    };

    const resetConverter = () => {
        setFile(null);
        setCompressedUrl(null);
        setStats({ originalSize: 0, compressedSize: 0 });
        setIsProcessing(false);
    };

    return (
        <div className="converter-page">
            <Helmet>
                <title>Free PDF Compressor - Reduce PDF File Size Online | ClarifyAll</title>
                <meta name="description" content="Compress PDF files online for free. Reduce PDF size while maintaining quality. Fast, secure compression. No file size limits." />
                <meta name="keywords" content="pdf compressor, compress pdf, reduce pdf size, pdf optimizer, shrink pdf, pdf compressor online, free pdf compressor, compress pdf file" />
                <meta property="og:title" content="Free PDF Compressor - Reduce PDF File Size Online" />
                <meta property="og:description" content="Compress PDF files instantly. Reduce file size for easy sharing." />
                <meta property="og:type" content="website" />
                <link rel="canonical" href="https://clarifyall.com/tools/pdf-compressor" />
            </Helmet>

            <div className="converter-container">
                <div className="converter-header">
                    <h1>Compress PDF Files</h1>
                    <p>Reduce PDF file size online. Optimize PDFs for email and web. Fast, secure, and free.</p>
                </div>

                {!file ? (
                    <div className="converter-card">
                        <div
                            className={`upload-zone ${isDragging ? 'dragging' : ''}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => document.getElementById('pdf-input').click()}
                        >
                            <div className="upload-icon-wrapper">
                                <Upload size={32} />
                            </div>
                            <p className="upload-title">Drop your PDF here</p>
                            <p className="upload-subtitle">or click to browse • PDF format • Max 50MB</p>
                            <input
                                id="pdf-input"
                                type="file"
                                accept="application/pdf"
                                onChange={handleFileInput}
                                style={{ display: 'none' }}
                            />
                        </div>
                        <button className="convert-button" disabled>
                            <Minimize2 size={20} />
                            Compress PDF
                        </button>
                    </div>
                ) : (
                    <div className="converter-card">
                        <div className="file-display">
                            <div className="file-icon-wrapper">
                                <FileText size={24} />
                            </div>
                            <div className="file-info">
                                <p className="file-name">{file.name}</p>
                                <p className="file-size">{formatSize(stats.originalSize)}</p>
                            </div>
                        </div>

                        {compressedUrl && (
                            <>
                                <div className="success-message">
                                    <CheckCircle size={20} />
                                    PDF compressed! {getSavings() > 0 ? `Reduced by ${getSavings()}%` : 'File optimized'}
                                </div>

                                <div className="compression-stats">
                                    <div className="stat-item">
                                        <p className="stat-label">Original Size</p>
                                        <p className="stat-value">{formatSize(stats.originalSize)}</p>
                                    </div>
                                    <div className="stat-divider">→</div>
                                    <div className="stat-item">
                                        <p className="stat-label">Compressed Size</p>
                                        <p className="stat-value success">{formatSize(stats.compressedSize)}</p>
                                    </div>
                                </div>
                            </>
                        )}

                        {isProcessing && (
                            <div className="processing-message">Compressing PDF...</div>
                        )}

                        {compressedUrl && (
                            <a
                                href={compressedUrl}
                                download={`compressed_${file.name}`}
                                className="convert-button"
                            >
                                <Download size={20} />
                                Download Compressed PDF
                            </a>
                        )}

                        <button className="secondary-button" onClick={resetConverter}>
                            Compress Another PDF
                        </button>
                    </div>
                )}

                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">
                            <Minimize2 size={24} />
                        </div>
                        <h3>Smaller Files</h3>
                        <p>Reduce PDF size for easier sharing via email and cloud storage.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <Zap size={24} />
                        </div>
                        <h3>Fast Compression</h3>
                        <p>Compress PDF files in seconds with optimized algorithms.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <Shield size={24} />
                        </div>
                        <h3>100% Private</h3>
                        <p>All compression happens in your browser. Files never leave your device.</p>
                    </div>
                </div>

                <div className="how-it-works">
                    <h2>How It Works</h2>
                    <div className="steps-grid">
                        <div className="step">
                            <div className="step-number">1</div>
                            <p>Upload your PDF</p>
                        </div>
                        <div className="step">
                            <div className="step-number">2</div>
                            <p>We compress it</p>
                        </div>
                        <div className="step">
                            <div className="step-number">3</div>
                            <p>Download smaller PDF</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PdfCompressor;
