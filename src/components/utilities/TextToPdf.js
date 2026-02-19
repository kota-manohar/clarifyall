import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import jsPDF from 'jspdf';
import { Download, FileText, CheckCircle, Type, AlignLeft } from 'lucide-react';
import '../../styles/Utilities.css';

const TextToPdf = () => {
    const [textInput, setTextInput] = useState('');
    const [fontSize, setFontSize] = useState(12);
    const [orientation, setOrientation] = useState('portrait');
    const [generated, setGenerated] = useState(false);

    const generatePDF = () => {
        if (!textInput) return;

        const doc = new jsPDF({
            orientation: orientation,
            unit: 'mm',
            format: 'a4'
        });

        // Set font size
        doc.setFontSize(fontSize);

        // Calculate margins and page dimensions
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        const maxWidth = pageWidth - 2 * margin;

        // Split text into lines that fit the page width
        const lines = doc.splitTextToSize(textInput, maxWidth);

        let cursorY = margin;
        const lineHeight = fontSize * 0.4;

        lines.forEach((line, index) => {
            // Check if we need a new page
            if (cursorY + lineHeight > pageHeight - margin) {
                doc.addPage();
                cursorY = margin;
            }

            doc.text(line, margin, cursorY);
            cursorY += lineHeight;
        });

        doc.save('document.pdf');
        setGenerated(true);
        setTimeout(() => setGenerated(false), 3000);
    };

    const reset = () => {
        setTextInput('');
        setFontSize(12);
        setOrientation('portrait');
        setGenerated(false);
    };

    return (
        <div className="converter-page">
            <Helmet>
                <title>Free Text to PDF Converter Online | ClarifyAll</title>
                <meta name="description" content="Convert text to PDF online for free. Create PDF documents from plain text instantly. Customize font size and page orientation." />
                <meta name="keywords" content="text to pdf, convert text to pdf, create pdf from text, text to pdf converter, plain text to pdf, free pdf converter" />
                <meta property="og:title" content="Free Text to PDF Converter" />
                <meta property="og:description" content="Convert plain text to PDF documents instantly." />
                <link rel="canonical" href="https://clarifyall.com/tools/text-to-pdf" />
            </Helmet>

            <div className="converter-container">
                <div className="converter-header">
                    <h1>Text to PDF Converter</h1>
                    <p>Convert plain text to PDF documents. Customize font size and page orientation.</p>
                </div>

                <div className="converter-card">
                    <div className="text-input-section">
                        <label className="input-label">Enter Your Text:</label>
                        <textarea
                            className="text-input large"
                            placeholder="Type or paste your text here..."
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            rows={12}
                        />
                    </div>

                    <div className="pdf-settings">
                        <div className="setting-group">
                            <label className="input-label">
                                <Type size={16} />
                                Font Size:
                            </label>
                            <select
                                className="select-input"
                                value={fontSize}
                                onChange={(e) => setFontSize(Number(e.target.value))}
                            >
                                <option value={10}>10pt (Small)</option>
                                <option value={12}>12pt (Normal)</option>
                                <option value={14}>14pt (Medium)</option>
                                <option value={16}>16pt (Large)</option>
                                <option value={18}>18pt (Extra Large)</option>
                            </select>
                        </div>

                        <div className="setting-group">
                            <label className="input-label">
                                <AlignLeft size={16} />
                                Orientation:
                            </label>
                            <select
                                className="select-input"
                                value={orientation}
                                onChange={(e) => setOrientation(e.target.value)}
                            >
                                <option value="portrait">Portrait</option>
                                <option value="landscape">Landscape</option>
                            </select>
                        </div>
                    </div>

                    {generated && (
                        <div className="success-message">
                            <CheckCircle size={20} />
                            PDF generated and downloaded successfully!
                        </div>
                    )}

                    <button onClick={generatePDF} className="convert-button" disabled={!textInput}>
                        <Download size={20} />
                        Generate & Download PDF
                    </button>

                    {textInput && (
                        <button className="secondary-button" onClick={reset}>
                            Clear Text
                        </button>
                    )}
                </div>

                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">
                            <FileText size={24} />
                        </div>
                        <h3>Simple Conversion</h3>
                        <p>Convert plain text to professional PDF documents instantly.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <Type size={24} />
                        </div>
                        <h3>Customizable</h3>
                        <p>Choose font size and page orientation to suit your needs.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <Download size={24} />
                        </div>
                        <h3>Instant Download</h3>
                        <p>Generate and download your PDF with a single click.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TextToPdf;
