import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import * as XLSX from 'xlsx';
import { Download, FileText, Upload, Zap, Shield, CheckCircle } from 'lucide-react';
import '../../styles/Utilities.css';

const ExcelToCsv = () => {
    const [file, setFile] = useState(null);
    const [csvData, setCsvData] = useState(null);
    const [preview, setPreview] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [sheetNames, setSheetNames] = useState([]);
    const [selectedSheet, setSelectedSheet] = useState(0);

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
        if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls'))) {
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
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            setSheetNames(workbook.SheetNames);
            processWorkbook(workbook, 0);
        };
        reader.readAsArrayBuffer(selectedFile);
    };

    const processWorkbook = (workbook, sheetIndex) => {
        const worksheet = workbook.Sheets[workbook.SheetNames[sheetIndex]];
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        setCsvData(csv);

        // Generate preview
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        setPreview(jsonData.slice(0, 10));
    };

    const handleSheetChange = (e) => {
        const sheetIndex = parseInt(e.target.value);
        setSelectedSheet(sheetIndex);

        const reader = new FileReader();
        reader.onload = (event) => {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            processWorkbook(workbook, sheetIndex);
        };
        reader.readAsArrayBuffer(file);
    };

    const downloadCsv = () => {
        if (!csvData) return;

        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${file.name.replace(/\.(xlsx?|XLSX?)$/, '')}_${sheetNames[selectedSheet]}.csv`;
        a.click();
    };

    const resetConverter = () => {
        setFile(null);
        setCsvData(null);
        setPreview(null);
        setSheetNames([]);
        setSelectedSheet(0);
    };

    return (
        <div className="converter-page">
            <Helmet>
                <title>Free Excel to CSV Converter - Convert XLSX to CSV Online | ClarifyAll</title>
                <meta name="description" content="Convert Excel (XLSX/XLS) files to CSV format online for free. Export spreadsheet data, choose specific sheets, secure processing. No software required." />
                <meta name="keywords" content="excel to csv, xlsx to csv, convert excel to csv, excel converter, spreadsheet to csv, excel to csv online, free excel converter, xls to csv" />
                <meta property="og:title" content="Free Excel to CSV Converter - Convert XLSX to CSV Online" />
                <meta property="og:description" content="Convert Excel files to CSV format instantly. Export data for any application." />
                <meta property="og:type" content="website" />
                <link rel="canonical" href="https://clarifyall.com/tools/excel-to-csv" />
            </Helmet>

            <div className="converter-container">
                <div className="converter-header">
                    <h1>Convert Excel to CSV</h1>
                    <p>Extract data from Excel spreadsheets to CSV format. Choose sheets to export. Fast, secure, and free.</p>
                </div>

                {!file ? (
                    <div className="converter-card">
                        <div
                            className={`upload-zone ${isDragging ? 'dragging' : ''}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => document.getElementById('excel-input').click()}
                        >
                            <div className="upload-icon-wrapper">
                                <Upload size={32} />
                            </div>
                            <p className="upload-title">Drop your Excel file here</p>
                            <p className="upload-subtitle">or click to browse • XLSX/XLS format • Max 10MB</p>
                            <input
                                id="excel-input"
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={handleFileInput}
                                style={{ display: 'none' }}
                            />
                        </div>
                        <button className="convert-button" disabled>
                            <FileText size={20} />
                            Convert to CSV
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

                        {sheetNames.length > 1 && (
                            <div className="sheet-selector">
                                <label>Select Sheet:</label>
                                <select value={selectedSheet} onChange={handleSheetChange}>
                                    {sheetNames.map((name, index) => (
                                        <option key={index} value={index}>{name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {preview && (
                            <>
                                <div className="success-message">
                                    <CheckCircle size={20} />
                                    Excel loaded! Converting sheet: {sheetNames[selectedSheet]}
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

                        <button onClick={downloadCsv} className="convert-button">
                            <Download size={20} />
                            Download as CSV
                        </button>

                        <button className="secondary-button" onClick={resetConverter}>
                            Convert Another Excel File
                        </button>
                    </div>
                )}

                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">
                            <FileText size={24} />
                        </div>
                        <h3>CSV Export</h3>
                        <p>Convert Excel spreadsheets to universally compatible CSV format.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <Zap size={24} />
                        </div>
                        <h3>Multi-Sheet Support</h3>
                        <p>Choose which sheet to export from workbooks with multiple sheets.</p>
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
                            <p>Upload your Excel file</p>
                        </div>
                        <div className="step">
                            <div className="step-number">2</div>
                            <p>Select sheet (if multiple)</p>
                        </div>
                        <div className="step">
                            <div className="step-number">3</div>
                            <p>Download as CSV</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExcelToCsv;
