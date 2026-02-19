import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Upload, Copy, Hash, FileText, CheckCircle, Lock, RefreshCw } from 'lucide-react';
import '../../styles/HashGenerator.css';

const HashGenerator = () => {
    const [inputType, setInputType] = useState('text'); // 'text' or 'file'
    const [textInput, setTextInput] = useState('');
    const [file, setFile] = useState(null);
    const [hashes, setHashes] = useState({});
    const [copied, setCopied] = useState('');
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
        if (droppedFile) {
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
        const arrayBuffer = await selectedFile.arrayBuffer();
        await generateHashes(arrayBuffer);
    };

    const handleTextHash = async () => {
        if (!textInput) return;
        const encoder = new TextEncoder();
        const data = encoder.encode(textInput);
        await generateHashes(data);
    };

    const generateHashes = async (data) => {
        const algorithms = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];
        const results = {};

        for (const algo of algorithms) {
            const hashBuffer = await crypto.subtle.digest(algo, data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            results[algo] = hashHex;
        }

        setHashes(results);
    };

    const copyHash = (hashValue, algo) => {
        navigator.clipboard.writeText(hashValue);
        setCopied(algo);
        setTimeout(() => setCopied(''), 2000);
    };

    const reset = () => {
        setTextInput('');
        setFile(null);
        setHashes({});
        setCopied('');
    };

    return (
        <div className="hash-tool-page">
            <Helmet>
                <title>Free Hash Generator - SHA-256, SHA-512, SHA-1 Online | ClarifyAll</title>
                <meta name="description" content="Generate cryptographic hashes online for free. Supports SHA-1, SHA-256, SHA-384, SHA-512. Hash text or files instantly." />
            </Helmet>

            <div className="hash-header">
                <h1>Hash Generator</h1>
                <p>Generate cryptographic hashes using SHA-1, SHA-256, SHA-384, and SHA-512 algorithms.</p>
            </div>

            <div className="hash-toggle-container">
                <button
                    className={`hash-toggle-btn ${inputType === 'text' ? 'active' : ''}`}
                    onClick={() => { setInputType('text'); reset(); }}
                >
                    <FileText size={18} />
                    Text
                </button>
                <button
                    className={`hash-toggle-btn ${inputType === 'file' ? 'active' : ''}`}
                    onClick={() => { setInputType('file'); reset(); }}
                >
                    <Upload size={18} />
                    File
                </button>
            </div>

            <div className="hash-card">
                {inputType === 'text' ? (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Enter Text:</label>
                        <textarea
                            className="hash-textarea"
                            placeholder="Enter text to generate hash..."
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            rows={5}
                        />
                        <button onClick={handleTextHash} className="hash-action-btn" disabled={!textInput}>
                            <Hash size={20} />
                            Generate Hashes
                        </button>
                    </div>
                ) : (
                    <div
                        className={`hash-upload-zone ${isDragging ? 'dragging' : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById('hash-file-input').click()}
                    >
                        <div className="hash-upload-icon">
                            <Upload size={28} />
                        </div>
                        <p className="font-semibold text-lg mb-1">Drop file to hash or click to browse</p>
                        <p className="text-gray-500 text-sm">Any file type supported</p>
                        <input
                            id="hash-file-input"
                            type="file"
                            onChange={handleFileInput}
                            style={{ display: 'none' }}
                        />
                    </div>
                )}

                {file && (
                    <div className="file-info-card">
                        <div className="file-info-icon">
                            <FileText size={20} />
                        </div>
                        <div>
                            <p className="file-name">{file.name}</p>
                            <p className="file-size">{(file.size / 1024).toFixed(2)} KB</p>
                        </div>
                    </div>
                )}

                {Object.keys(hashes).length > 0 && (
                    <div className="hash-results-container">
                        <div className="flex items-center gap-2 text-green-600 font-medium mb-6">
                            <CheckCircle size={20} />
                            Hashes generated successfully!
                        </div>

                        {Object.entries(hashes).map(([algo, hash]) => (
                            <div key={algo} className="hash-result-item">
                                <div className="hash-result-header">
                                    <span className="hash-algo-name">{algo}</span>
                                    <button
                                        onClick={() => copyHash(hash, algo)}
                                        className="hash-copy-btn"
                                    >
                                        {copied === algo ? <CheckCircle size={14} className="text-green-600" /> : <Copy size={14} />}
                                        {copied === algo ? 'Copied' : 'Copy'}
                                    </button>
                                </div>
                                <div className="hash-value">{hash}</div>
                            </div>
                        ))}

                        <button className="hash-reset-btn" onClick={reset}>
                            <RefreshCw size={18} />
                            Generate Another Hash
                        </button>
                    </div>
                )}
            </div>

            <div className="features-grid">
                <div className="feature-card">
                    <div className="feature-icon">
                        <Lock size={24} />
                    </div>
                    <h3>Secure Algorithms</h3>
                    <p>Uses SHA-1, SHA-256, SHA-384, and SHA-512 cryptographic algorithms.</p>
                </div>
                <div className="feature-card">
                    <div className="feature-icon">
                        <Hash size={24} />
                    </div>
                    <h3>Multiple Hashes</h3>
                    <p>Generate all hashes at once for comparison and verification.</p>
                </div>
                <div className="feature-card">
                    <div className="feature-icon">
                        <FileText size={24} />
                    </div>
                    <h3>Files & Text</h3>
                    <p>Hash any text string or file for integrity verification.</p>
                </div>
            </div>
        </div>
    );
};

export default HashGenerator;
