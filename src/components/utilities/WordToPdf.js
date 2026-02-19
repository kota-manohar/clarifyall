import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import mammoth from 'mammoth';
import jsPDF from 'jspdf';
import { Download, FileText, Upload, Zap, Shield, CheckCircle, Lock } from 'lucide-react';
import '../../styles/Utilities.css';

const WordToPdf = () => {
    const [file, setFile] = useState(null);
    const [error, setError] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [pdfUrl, setPdfUrl] = useState(null);
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
        if (droppedFile && (droppedFile.name.endsWith('.docx') || droppedFile.name.endsWith('.doc'))) {
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
        setError(null);
        setPdfUrl(null);
        convertWordToPdf(selectedFile);
    };

    const convertWordToPdf = async (wordFile) => {
        setIsProcessing(true);
        try {
            const arrayBuffer = await wordFile.arrayBuffer();

            // Extract plain text from Word document
            const result = await mammoth.extractRawText({ arrayBuffer });
            const text = result.value;

            if (!text || text.trim().length === 0) {
                throw new Error('No text content found in the document');
            }

            // Create PDF with text
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const pageWidth = 210;
            const pageHeight = 297;
            const margin = 20;
            const textWidth = pageWidth - (2 * margin);
            const lineHeight = 7;
            const fontSize = 11;

            pdf.setFontSize(fontSize);
            pdf.setFont('helvetica');

            // Split text into lines that fit the page width
            const lines = pdf.splitTextToSize(text, textWidth);

            let yPosition = margin;
            const maxLinesPerPage = Math.floor((pageHeight - (2 * margin)) / lineHeight);

            lines.forEach((line, index) => {
                // Add new page if needed
                if (index > 0 && index % maxLinesPerPage === 0) {
                    pdf.addPage();
                    yPosition = margin;
                }

                pdf.text(line, margin, yPosition);
                yPosition += lineHeight;
            });

            // Create blob and URL
            const pdfBlob = pdf.output('blob');
            const url = URL.createObjectURL(pdfBlob);
            setPdfUrl(url);
            setIsProcessing(false);
        } catch (err) {
            console.error('Conversion error:', err);
            setError('Failed to convert Word file. Please ensure it\'s a valid DOCX file with text content.');
            setIsProcessing(false);
        }
    };

    const resetConverter = () => {
        setFile(null);
        setError(null);
        setPdfUrl(null);
        setIsProcessing(false);
    };

    return (
        <div className="converter-page">
            <Helmet>
                <title>Free Word to PDF Converter - Convert DOCX to PDF Online | ClarifyAll</title>
                <meta name="description" content="Convert Word documents to PDF instantly. Free DOCX to PDF converter online. Preserve formatting, fast conversion, 100% secure. No software installation required." />
                <meta name="keywords" content="word to pdf, docx to pdf, convert word to pdf, word converter, doc to pdf, word to pdf online, free word converter, microsoft word to pdf, document converter" />
                <meta property="og:title" content="Free Word to PDF Converter - Convert DOCX to PDF Online" />
                <meta property="og:description" content="Convert Word documents to PDF instantly. Fast, secure, and easy to use." />
                <meta property="og:type" content="website" />
                <link rel="canonical" href="https://clarifyall.com/tools/word-to-pdf" />
            </Helmet>

            <div className="converter-container">
                <div className="converter-header">
                    <h1>Convert Word to PDF</h1>
                    <p>Transform your Word documents into professional PDFs. Preserve formatting and layout. Fast, secure, and free.</p>
                </div>

                {!file ? (
                    <div className="converter-card">
                        <div
                            className={`upload-zone ${isDragging ? 'dragging' : ''}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => document.getElementById('word-input').click()}
                        >
                            <div className="upload-icon-wrapper">
                                <Upload size={32} />
                            </div>
                            <p className="upload-title">Drop your Word file here</p>
                            <p className="upload-subtitle">or click to browse • DOCX format • Max 10MB</p>
                            <input
                                id="word-input"
                                type="file"
                                accept=".docx,.doc"
                                onChange={handleFileInput}
                                style={{ display: 'none' }}
                            />
                        </div>
                        <button className="convert-button" disabled>
                            <FileText size={20} />
                            Convert to PDF
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
                                <p className="file-size">{(file.size / 1024).toFixed(1)} KB</p>
                            </div>
                        </div>

                        {isProcessing && (
                            <div className="processing-message">
                                Converting to PDF... This may take a moment.
                            </div>
                        )}

                        {pdfUrl && (
                            <div className="success-message">
                                <CheckCircle size={20} />
                                Conversion complete! Your PDF is ready to download.
                            </div>
                        )}

                        {error && (
                            <div className="error-message">{error}</div>
                        )}

                        <a
                            href={pdfUrl}
                            download={`${file.name.replace(/\.(docx?|DOCX?)$/, '')}.pdf`}
                            className={`convert-button ${!pdfUrl ? 'disabled' : ''}`}
                            style={{ pointerEvents: !pdfUrl ? 'none' : 'auto' }}
                        >
                            <Download size={20} />
                            {isProcessing ? 'Converting...' : 'Download PDF'}
                        </a>

                        <button className="secondary-button" onClick={resetConverter}>
                            Convert Another Word File
                        </button>
                    </div>
                )}

                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">
                            <Zap size={24} />
                        </div>
                        <h3>Fast Conversion</h3>
                        <p>Convert your Word files to PDF in seconds without quality loss.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <Lock size={24} />
                        </div>
                        <h3>100% Secure</h3>
                        <p>All processing happens in your browser. Files never leave your device.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <Shield size={24} />
                        </div>
                        <h3>Format Preserved</h3>
                        <p>Maintain document formatting, fonts, and layout in the PDF output.</p>
                    </div>
                </div>

                <div className="how-it-works">
                    <h2>How It Works</h2>
                    <div className="steps-grid">
                        <div className="step">
                            <div className="step-number">1</div>
                            <p>Upload your Word file</p>
                        </div>
                        <div className="step">
                            <div className="step-number">2</div>
                            <p>We convert it to PDF</p>
                        </div>
                        <div className="step">
                            <div className="step-number">3</div>
                            <p>Download your PDF</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WordToPdf;
