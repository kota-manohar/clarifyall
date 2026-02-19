import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { PDFDocument } from 'pdf-lib';
import { Download, FileText, Upload, Zap, Shield, CheckCircle, Copy } from 'lucide-react';
import '../../styles/Utilities.css';

const PdfMerger = () => {
    const [files, setFiles] = useState([]);
    const [mergedUrl, setMergedUrl] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
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
        const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
        if (droppedFiles.length > 0) {
            setFiles(prev => [...prev, ...droppedFiles]);
        }
    };

    const handleFileInput = (e) => {
        const selectedFiles = Array.from(e.target.files);
        setFiles(prev => [...prev, ...selectedFiles]);
    };

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const mergePDFs = async () => {
        if (files.length < 2) {
            alert('Please select at least 2 PDF files to merge');
            return;
        }

        setIsProcessing(true);
        try {
            const mergedPdf = await PDFDocument.create();

            for (const file of files) {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await PDFDocument.load(arrayBuffer);
                const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                copiedPages.forEach((page) => mergedPdf.addPage(page));
            }

            const mergedPdfBytes = await mergedPdf.save();
            const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            setMergedUrl(url);
            setIsProcessing(false);
        } catch (error) {
            console.error('Merge error:', error);
            setIsProcessing(false);
            alert('Failed to merge PDFs. Please try again.');
        }
    };

    const resetConverter = () => {
        setFiles([]);
        setMergedUrl(null);
        setIsProcessing(false);
    };

    return (
        <div className="converter-page">
            <Helmet>
                <title>Free PDF Merger - Combine PDF Files Online | ClarifyAll</title>
                <meta name="description" content="Merge multiple PDF files into one document online for free. Combine PDFs in any order. Fast, secure merging. No file limits." />
                <meta name="keywords" content="pdf merger, merge pdf, combine pdf, join pdf, pdf merger online, free pdf merger, merge pdf files, combine pdf files" />
                <meta property="og:title" content="Free PDF Merger - Combine PDF Files Online" />
                <meta property="og:description" content="Merge multiple PDFs into one document instantly. Easy and secure." />
                <meta property="og:type" content="website" />
                <link rel="canonical" href="https://clarifyall.com/tools/pdf-merger" />
            </Helmet>

            <div className="converter-container">
                <div className="converter-header">
                    <h1>Merge PDF Files</h1>
                    <p>Combine multiple PDF documents into one. Arrange pages in any order. Fast, secure, and free.</p>
                </div>

                <div className="converter-card">
                    <div
                        className={`upload-zone ${isDragging ? 'dragging' : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById('pdf-files-input').click()}
                    >
                        <div className="upload-icon-wrapper">
                            <Upload size={32} />
                        </div>
                        <p className="upload-title">Drop PDF files here</p>
                        <p className="upload-subtitle">or click to browse • Select multiple PDFs • Max 50MB each</p>
                        <input
                            id="pdf-files-input"
                            type="file"
                            accept="application/pdf"
                            multiple
                            onChange={handleFileInput}
                            style={{ display: 'none' }}
                        />
                    </div>

                    {files.length > 0 && (
                        <div className="files-list">
                            <p className="files-list-header">{files.length} PDF{files.length > 1 ? 's' : ''} selected</p>
                            {files.map((file, index) => (
                                <div key={index} className="file-item">
                                    <div className="file-item-info">
                                        <FileText size={20} />
                                        <span className="file-item-name">{file.name}</span>
                                    </div>
                                    <button
                                        className="file-item-remove"
                                        onClick={() => removeFile(index)}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {mergedUrl && (
                        <div className="success-message">
                            <CheckCircle size={20} />
                            PDFs merged successfully! {files.length} files combined into one.
                        </div>
                    )}

                    {isProcessing && (
                        <div className="processing-message">Merging PDFs...</div>
                    )}

                    {!mergedUrl && (
                        <button
                            onClick={mergePDFs}
                            className="convert-button"
                            disabled={files.length < 2 || isProcessing}
                        >
                            <Copy size={20} />
                            {isProcessing ? 'Merging...' : 'Merge PDFs'}
                        </button>
                    )}

                    {mergedUrl && (
                        <>
                            <a
                                href={mergedUrl}
                                download="merged.pdf"
                                className="convert-button"
                            >
                                <Download size={20} />
                                Download Merged PDF
                            </a>
                            <button className="secondary-button" onClick={resetConverter}>
                                Merge More PDFs
                            </button>
                        </>
                    )}
                </div>

                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">
                            <Copy size={24} />
                        </div>
                        <h3>Combine Multiple PDFs</h3>
                        <p>Merge unlimited PDF files into a single document effortlessly.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <Zap size={24} />
                        </div>
                        <h3>Fast Merging</h3>
                        <p>Combine PDFs in seconds with our optimized merging engine.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <Shield size={24} />
                        </div>
                        <h3>100% Private</h3>
                        <p>All merging happens in your browser. Files never leave your device.</p>
                    </div>
                </div>

                <div className="how-it-works">
                    <h2>How It Works</h2>
                    <div className="steps-grid">
                        <div className="step">
                            <div className="step-number">1</div>
                            <p>Upload multiple PDFs</p>
                        </div>
                        <div className="step">
                            <div className="step-number">2</div>
                            <p>Click Merge PDFs</p>
                        </div>
                        <div className="step">
                            <div className="step-number">3</div>
                            <p>Download combined PDF</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PdfMerger;
