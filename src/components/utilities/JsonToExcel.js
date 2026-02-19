import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import * as XLSX from 'xlsx';
import { Download, FileJson, Upload, Zap, Shield, CheckCircle, Table } from 'lucide-react';
import '../../styles/Utilities.css';

const JsonToExcel = () => {
    const [file, setFile] = useState(null);
    const [error, setError] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [downloadReady, setDownloadReady] = useState(false);
    const [workbook, setWorkbook] = useState(null);
    const [previewData, setPreviewData] = useState([]);
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
        if (droppedFile && droppedFile.name.endsWith('.json')) {
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
        setDownloadReady(false);
        convertJson(selectedFile);
    };

    const convertJson = (jsonFile) => {
        setIsProcessing(true);
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const jsonData = JSON.parse(e.target.result);
                let dataToConvert = [];

                if (Array.isArray(jsonData)) {
                    dataToConvert = jsonData;
                } else if (typeof jsonData === 'object') {
                    const possibleArray = Object.values(jsonData).find(val => Array.isArray(val));
                    if (possibleArray) {
                        dataToConvert = possibleArray;
                    } else {
                        dataToConvert = [jsonData];
                    }
                }

                if (dataToConvert.length === 0) {
                    throw new Error("No data found to convert.");
                }

                const wb = XLSX.utils.book_new();
                const ws = XLSX.utils.json_to_sheet(dataToConvert);
                XLSX.utils.book_append_sheet(wb, ws, "Data");

                setWorkbook(wb);
                setPreviewData(dataToConvert.slice(0, 5));
                setDownloadReady(true);
                setIsProcessing(false);
            } catch (err) {
                setError("Invalid JSON format. Please upload a valid JSON file.");
                setIsProcessing(false);
            }
        };

        reader.readAsText(jsonFile);
    };

    const handleDownload = () => {
        if (workbook && file) {
            XLSX.writeFile(workbook, `${file.name.replace('.json', '')}.xlsx`);
        }
    };

    const resetConverter = () => {
        setFile(null);
        setError(null);
        setDownloadReady(false);
        setWorkbook(null);
        setPreviewData([]);
        setIsProcessing(false);
    };

    return (
        <div className="converter-page">
            <Helmet>
                <title>Free JSON to Excel Converter - Convert JSON to XLSX Online | ClarifyAll</title>
                <meta name="description" content="Convert JSON files to Excel (XLSX) spreadsheets online for free. Fast JSON to Excel converter for data analysis. Secure browser-based conversion. No upload required." />
                <meta name="keywords" content="json to excel, json to xlsx, convert json to excel, json converter, json to spreadsheet, json to csv, data converter, json parser, json to excel online, free json converter" />
                <meta property="og:title" content="Free JSON to Excel Converter - Convert JSON to XLSX Online" />
                <meta property="og:description" content="Convert JSON files to Excel spreadsheets instantly. Perfect for data analysis and reporting." />
                <meta property="og:type" content="website" />
                <link rel="canonical" href="https://clarifyall.com/tools/json-to-excel" />
            </Helmet>

            <div className="converter-container">
                <div className="converter-header">
                    <h1>Convert JSON to Excel</h1>
                    <p>Transform your data into readable spreadsheets. Perfect for analysis. Fast, secure, and free.</p>
                </div>

                {!file ? (
                    <div className="converter-card">
                        <div
                            className={`upload-zone ${isDragging ? 'dragging' : ''}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => document.getElementById('json-input').click()}
                        >
                            <div className="upload-icon-wrapper">
                                <Upload size={32} />
                            </div>
                            <p className="upload-title">Drop your JSON here</p>
                            <p className="upload-subtitle">or click to browse • Max 10MB</p>
                            <input
                                id="json-input"
                                type="file"
                                accept=".json"
                                onChange={handleFileInput}
                                style={{ display: 'none' }}
                            />
                        </div>
                        <button className="convert-button" disabled>
                            <FileJson size={20} />
                            Convert to Excel
                        </button>
                    </div>
                ) : (
                    <div className="converter-card">
                        <div className="file-display">
                            <div className="file-icon-wrapper">
                                <FileJson size={24} />
                            </div>
                            <div className="file-info">
                                <p className="file-name">{file.name}</p>
                                <p className="file-size">{(file.size / 1024).toFixed(1)} KB</p>
                            </div>
                        </div>

                        {downloadReady && (
                            <div className="success-message">
                                <CheckCircle size={20} />
                                Conversion complete! Your Excel file is ready to download.
                            </div>
                        )}

                        {error && (
                            <div className="error-message">{error}</div>
                        )}

                        {previewData.length > 0 && (
                            <div className="preview-section">
                                <h4>Data Preview (First 5 records)</h4>
                                <div className="preview-scroll">
                                    <table className="preview-table">
                                        <thead>
                                            <tr>
                                                {Object.keys(previewData[0]).slice(0, 5).map(key => (
                                                    <th key={key}>{key}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {previewData.map((row, idx) => (
                                                <tr key={idx}>
                                                    {Object.values(row).slice(0, 5).map((val, i) => (
                                                        <td key={i}>
                                                            {typeof val === 'object' ? JSON.stringify(val).substring(0, 20) + '...' : String(val)}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        <button
                            className="convert-button"
                            onClick={handleDownload}
                            disabled={!downloadReady}
                        >
                            <Download size={20} />
                            Download Excel (.xlsx)
                        </button>

                        <button className="secondary-button" onClick={resetConverter}>
                            Convert Another JSON
                        </button>
                    </div>
                )}

                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">
                            <Zap size={24} />
                        </div>
                        <h3>Fast Conversion</h3>
                        <p>Convert your JSON files to Excel in seconds with our powerful processing engine.</p>
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
                            <Table size={24} />
                        </div>
                        <h3>Clean Data</h3>
                        <p>Get well-formatted Excel spreadsheets perfect for analysis and reporting.</p>
                    </div>
                </div>

                <div className="how-it-works">
                    <h2>How It Works</h2>
                    <div className="steps-grid">
                        <div className="step">
                            <div className="step-number">1</div>
                            <p>Upload your JSON file</p>
                        </div>
                        <div className="step">
                            <div className="step-number">2</div>
                            <p>We extract the data</p>
                        </div>
                        <div className="step">
                            <div className="step-number">3</div>
                            <p>Download your Excel file</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JsonToExcel;
