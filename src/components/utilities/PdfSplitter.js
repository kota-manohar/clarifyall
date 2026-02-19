import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { PDFDocument } from 'pdf-lib';
import { Download, FileText, Upload, Zap, Shield, CheckCircle, Scissors } from 'lucide-react';
import '../../styles/Utilities.css';

const PdfSplitter = () => {
    const [file, setFile] = useState(null);
    const [pageCount, setPageCount] = useState(0);
    const [splitPages, setSplitPages] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [pdfDoc, setPdfDoc] = useState(null);

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
        setIsProcessing(true);

        try {
            const arrayBuffer = await selectedFile.arrayBuffer();
            const pdf = await PDFDocument.load(arrayBuffer);
            const pages = pdf.getPageCount();
            setPageCount(pages);
            setPdfDoc(pdf);
            setIsProcessing(false);
        } catch (error) {
            console.error('Load error:', error);
            setIsProcessing(false);
            alert('Failed to load PDF. Please try again.');
        }
    };

    const splitAllPages = async () => {
        if (!pdfDoc) return;

        setIsProcessing(true);
        const pages = [];

        try {
            for (let i = 0; i < pageCount; i++) {
                const newPdf = await PDFDocument.create();
                const [copiedPage] = await newPdf.copyPages(pdfDoc, [i]);
                newPdf.addPage(copiedPage);
                const pdfBytes = await newPdf.save();
                const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);
                pages.push({ pageNum: i + 1, url, blob });
            }

            setSplitPages(pages);
            setIsProcessing(false);
        } catch (error) {
            console.error('Split error:', error);
            setIsProcessing(false);
            alert('Failed to split PDF. Please try again.');
        }
    };

    const downloadPage = (page) => {
        const a = document.createElement('a');
        a.href = page.url;
        a.download = `${file.name.replace('.pdf', '')}_page_${page.pageNum}.pdf`;
        a.click();
    };

    const downloadAll = () => {
        splitPages.forEach(page => {
            setTimeout(() => downloadPage(page), 100 * (page.pageNum - 1));
        });
    };

    const resetConverter = () => {
        setFile(null);
        setPageCount(0);
        setSplitPages([]);
        setPdfDoc(null);
        setIsProcessing(false);
    };

    return (
        <div className="converter-page">
            <Helmet>
                <title>Free PDF Splitter - Extract PDF Pages Online | ClarifyAll</title>
                <meta name="description" content="Split PDF files into separate pages online for free. Extract individual pages from PDF documents. Fast, secure splitting. No file limits." />
                <meta name="keywords" content="pdf splitter, split pdf, extract pdf pages, pdf page extractor, pdf splitter online, free pdf splitter, split pdf pages" />
                <meta property="og:title" content="Free PDF Splitter - Extract PDF Pages Online" />
                <meta property="og:description" content="Split PDF into individual pages instantly. Extract what you need." />
                <meta property="og:type" content="website" />
                <link rel="canonical" href="https://clarifyall.com/tools/pdf-splitter" />
            </Helmet>

            <div className="converter-container">
                <div className="converter-header">
                    <h1>Split PDF Pages</h1>
                    <p>Extract individual pages from PDF documents. Download each page separately. Fast, secure, and free.</p>
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
                            <Scissors size={20} />
                            Split PDF
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
                                <p className="file-size">{pageCount} pages</p>
                            </div>
                        </div>

                        {splitPages.length > 0 && (
                            <>
                                <div className="success-message">
                                    <CheckCircle size={20} />
                                    PDF split into {splitPages.length} separate pages!
                                </div>

                                <div className="split-pages-list">
                                    <p className="split-pages-header">Download Individual Pages:</p>
                                    <div className="split-pages-grid">
                                        {splitPages.map((page) => (
                                            <button
                                                key={page.pageNum}
                                                onClick={() => downloadPage(page)}
                                                className="split-page-item"
                                            >
                                                <FileText size={16} />
                                                <span>Page {page.pageNum}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button onClick={downloadAll} className="convert-button">
                                    <Download size={20} />
                                    Download All Pages
                                </button>
                            </>
                        )}

                        {isProcessing && (
                            <div className="processing-message">
                                {splitPages.length === 0 ? 'Loading PDF...' : 'Splitting pages...'}
                            </div>
                        )}

                        {pageCount > 0 && splitPages.length === 0 && !isProcessing && (
                            <button onClick={splitAllPages} className="convert-button">
                                <Scissors size={20} />
                                Split into {pageCount} Pages
                            </button>
                        )}

                        <button className="secondary-button" onClick={resetConverter}>
                            Split Another PDF
                        </button>
                    </div>
                )}

                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">
                            <Scissors size={24} />
                        </div>
                        <h3>Extract Pages</h3>
                        <p>Split PDF into individual pages for easy sharing and organization.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <Zap size={24} />
                        </div>
                        <h3>Fast Splitting</h3>
                        <p>Extract all pages in seconds, download individually or all at once.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <Shield size={24} />
                        </div>
                        <h3>100% Private</h3>
                        <p>All splitting happens in your browser. Files never leave your device.</p>
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
                            <p>Click Split PDF</p>
                        </div>
                        <div className="step">
                            <div className="step-number">3</div>
                            <p>Download pages</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PdfSplitter;
