import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import { Download, FileText, Upload, Zap, Shield, CheckCircle } from 'lucide-react';
import '../../styles/Utilities.css';

const PdfToWord = () => {
    const [file, setFile] = useState(null);
    const [error, setError] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [docxBlob, setDocxBlob] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';
    }, []);

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

    const handleFileSelect = (selectedFile) => {
        setFile(selectedFile);
        setError(null);
        setDocxBlob(null);
        setProgress(0);
        convertPdf(selectedFile);
    };

    const convertPdf = async (pdfFile) => {
        setIsProcessing(true);
        try {
            const arrayBuffer = await pdfFile.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            const numPages = pdf.numPages;
            const docChildren = [];

            for (let i = 1; i <= numPages; i++) {
                setProgress(Math.round((i / numPages) * 100));
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();

                // Group text items into lines based on Y position
                const lines = {};
                textContent.items.forEach(item => {
                    const y = Math.round(item.transform[5]); // Y position
                    if (!lines[y]) {
                        lines[y] = [];
                    }
                    lines[y].push(item.str);
                });

                // Sort by Y position (top to bottom) and create paragraphs
                const sortedYPositions = Object.keys(lines).sort((a, b) => b - a);

                sortedYPositions.forEach(y => {
                    const lineText = lines[y].join(' ').trim();
                    if (lineText) { // Only add non-empty lines
                        docChildren.push(
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: lineText,
                                        size: 24, // 12pt
                                    })
                                ],
                                spacing: {
                                    after: 100,
                                }
                            })
                        );
                    }
                });

                // Add spacing between pages
                if (i < numPages) {
                    docChildren.push(
                        new Paragraph({
                            children: [new TextRun({ text: '', break: 2 })],
                        })
                    );
                }
            }

            const doc = new Document({
                sections: [{
                    properties: {},
                    children: docChildren,
                }]
            });

            const blob = await Packer.toBlob(doc);
            setDocxBlob(blob);
            setIsProcessing(false);
        } catch (err) {
            console.error('Conversion error:', err);
            setError('Failed to convert PDF. Please try another file.');
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (docxBlob && file) {
            saveAs(docxBlob, `${file.name.replace('.pdf', '')}.docx`);
        }
    };

    const resetConverter = () => {
        setFile(null);
        setError(null);
        setDocxBlob(null);
        setProgress(0);
        setIsProcessing(false);
    };

    return (
        <div className="converter-page">
            <Helmet>
                <title>Free PDF to Word Converter - Convert PDF to DOCX Online | ClarifyAll</title>
                <meta name="description" content="Convert PDF to Word documents online for free. Fast, secure PDF to DOCX converter. Extract text, tables, and formatting from PDFs instantly. No software installation required." />
                <meta name="keywords" content="pdf to word, pdf to docx, convert pdf to word, pdf converter, pdf to word online, free pdf converter, pdf to doc, extract text from pdf, pdf conversion tool" />
                <meta property="og:title" content="Free PDF to Word Converter - Convert PDF to DOCX Online" />
                <meta property="og:description" content="Convert PDF to Word documents online for free. Fast, secure, and easy to use." />
                <meta property="og:type" content="website" />
                <link rel="canonical" href="https://clarifyall.com/tools/pdf-to-word" />
            </Helmet>

            <div className="converter-container">
                <div className="converter-header">
                    <h1>Convert PDF to Word</h1>
                    <p>Extract tables and data from your PDF files into clean, editable Word documents. Fast, secure, and free.</p>
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
                            <p className="upload-subtitle">or click to browse • Max 10MB</p>
                            <input
                                id="pdf-input"
                                type="file"
                                accept=".pdf"
                                onChange={handleFileInput}
                                style={{ display: 'none' }}
                            />
                        </div>
                        <button className="convert-button" disabled>
                            <FileText size={20} />
                            Convert to Word
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
                            <div className="progress-bar">
                                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                            </div>
                        )}

                        {docxBlob && (
                            <div className="success-message">
                                <CheckCircle size={20} />
                                Conversion complete! Your Word file is ready to download.
                            </div>
                        )}

                        {error && (
                            <div className="error-message">{error}</div>
                        )}

                        <button
                            className="convert-button"
                            onClick={handleDownload}
                            disabled={!docxBlob || isProcessing}
                        >
                            <Download size={20} />
                            {isProcessing ? `Converting... ${progress}%` : 'Download Word File'}
                        </button>

                        <button className="secondary-button" onClick={resetConverter}>
                            Convert Another PDF
                        </button>
                    </div>
                )}

                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">
                            <Zap size={24} />
                        </div>
                        <h3>Fast Conversion</h3>
                        <p>Convert your PDF files to Word in seconds with our powerful processing engine.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <Shield size={24} />
                        </div>
                        <h3>Secure & Private</h3>
                        <p>Your files are processed securely and automatically deleted after conversion.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <FileText size={24} />
                        </div>
                        <h3>Quality Output</h3>
                        <p>Get clean, editable Word documents with preserved formatting and layout.</p>
                    </div>
                </div>

                <div className="how-it-works">
                    <h2>How It Works</h2>
                    <div className="steps-grid">
                        <div className="step">
                            <div className="step-number">1</div>
                            <p>Upload your PDF file</p>
                        </div>
                        <div className="step">
                            <div className="step-number">2</div>
                            <p>We extract the data</p>
                        </div>
                        <div className="step">
                            <div className="step-number">3</div>
                            <p>Download your Word file</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PdfToWord;
