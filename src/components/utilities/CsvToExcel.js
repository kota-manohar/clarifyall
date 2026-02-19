import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import * as XLSX from 'xlsx';
import { Download, FileSpreadsheet, Upload, Zap, Shield, CheckCircle } from 'lucide-react';
import '../../styles/Utilities.css';

const CsvToExcel = () => {
    const [file, setFile] = useState(null);
    const [workbook, setWorkbook] = useState(null);
    const [preview, setPreview] = useState(null);
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
        if (droppedFile && (droppedFile.name.endsWith('.csv') || droppedFile.type === 'text/csv')) {
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
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            const wb = XLSX.read(text, { type: 'string' });
            setWorkbook(wb);

            // Generate preview
            const worksheet = wb.Sheets[wb.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            setPreview(jsonData.slice(0, 10)); // Show first 10 rows
        };
        reader.readAsText(selectedFile);
    };

    const downloadExcel = () => {
        if (!workbook) return;

        // Write workbook to binary
        const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${file.name.replace('.csv', '')}.xlsx`;
        a.click();
    };

    const resetConverter = () => {
        setFile(null);
        setWorkbook(null);
        setPreview(null);
    };

    return (
        <div className="converter-page">
            <Helmet>
                <title>Free CSV to Excel Converter - Convert CSV to XLSX Online | ClarifyAll</title>
                <meta name="description" content="Convert CSV files to Excel (XLSX) spreadsheets online for free. Preserve data formatting, fast conversion, secure processing. No software required." />
                <meta name="keywords" content="csv to excel, csv to xlsx, convert csv to excel, csv converter, csv to spreadsheet, csv to excel online, free  converter, data converter" />
                <meta property="og:title" content="Free CSV to Excel Converter - Convert CSV to XLSX Online" />
                <meta property="og:description" content="Convert CSV files to Excel spreadsheets instantly. Fast and secure." />
                <meta property="og:type" content="website" />
                <link rel="canonical" href="https://clarifyall.com/tools/csv-to-excel" />
            </Helmet>

            <div className="converter-container">
                <div className="converter-header">
                    <h1>Convert CSV to Excel</h1>
                    <p>Transform CSV files into Excel spreadsheets. Preserve data structure. Fast, secure, and free.</p>
                </div>

                {!file ? (
                    <div className="converter-card">
                        <div
                            className={`upload-zone ${isDragging ? 'dragging' : ''}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => document.getElementById('csv-input').click()}
                        >
                            <div className="upload-icon-wrapper">
                                <Upload size={32} />
                            </div>
                            <p className="upload-title">Drop your CSV file here</p>
                            <p className="upload-subtitle">or click to browse • CSV format • Max 10MB</p>
                            <input
                                id="csv-input"
                                type="file"
                                accept=".csv,text/csv"
                                onChange={handleFileInput}
                                style={{ display: 'none' }}
                            />
                        </div>
                        <button className="convert-button" disabled>
                            <FileSpreadsheet size={20} />
                            Convert to Excel
                        </button>
                    </div>
                ) : (
                    <div className="converter-card">
                        <div className="file-display">
                            <div className="file-icon-wrapper">
                                <FileSpreadsheet size={24} />
                            </div>
                            <div className="file-info">
                                <p className="file-name">{file.name}</p>
                                <p className="file-size">{(file.size / 1024).toFixed(1)} KB</p>
                            </div>
                        </div>

                        {preview && (
                            <>
                                <div className="success-message">
                                    <CheckCircle size={20} />
                                    CSV loaded successfully! {preview.length} rows preview.
                                </div>

                                <div className="data-preview">
                                    <p className="preview-label">Data Preview</p>
                                    <div className="data-table-wrapper">
                                        <table className="data-table">
                                            <tbody>
                                                {preview.map((row, i) => (
                                                    <tr key={i}>
                                                        {row.map((cell, j) => (
                                                            <td key={j}>{cell}</td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}

                        <button onClick={downloadExcel} className="convert-button">
                            <Download size={20} />
                            Download as Excel
                        </button>

                        <button className="secondary-button" onClick={resetConverter}>
                            Convert Another CSV
                        </button>
                    </div>
                )}

                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">
                            <FileSpreadsheet size={24} />
                        </div>
                        <h3>Excel Format</h3>
                        <p>Convert CSV to XLSX format compatible with Excel and Google Sheets.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <Zap size={24} />
                        </div>
                        <h3>Instant Conversion</h3>
                        <p>Convert CSV to Excel in seconds with data preview.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <Shield size={24} />
                        </div>
                        <h3>100% Private</h3>
                        <p>All processing happens in your browser. Files never leave your device.</p>
                    </div>
                </div>

                <div className="how-it-works">
                    <h2>How It Works</h2>
                    <div className="steps-grid">
                        <div className="step">
                            <div className="step-number">1</div>
                            <p>Upload your CSV file</p>
                        </div>
                        <div className="step">
                            <div className="step-number">2</div>
                            <p>Preview your data</p>
                        </div>
                        <div className="step">
                            <div className="step-number">3</div>
                            <p>Download as Excel</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CsvToExcel;
