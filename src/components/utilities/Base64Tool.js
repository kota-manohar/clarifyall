import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Download, Upload, Copy, Code, FileText, CheckCircle, RefreshCw } from 'lucide-react';
import '../../styles/Base64Tool.css';

const Base64Tool = () => {
    const [mode, setMode] = useState('encode'); // 'encode' or 'decode'
    const [file, setFile] = useState(null);
    const [textInput, setTextInput] = useState('');
    const [result, setResult] = useState('');
    const [copied, setCopied] = useState(false);
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

    const handleFileSelect = (selectedFile) => {
        setFile(selectedFile);
        if (mode === 'encode') {
            encodeFile(selectedFile);
        }
    };

    const encodeFile = (fileToEncode) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = e.target.result;
            setResult(base64);
        };
        reader.readAsDataURL(fileToEncode);
    };

    const encodeText = () => {
        if (!textInput) return;
        try {
            const encoded = btoa(textInput);
            setResult(encoded);
        } catch (e) {
            alert('Unable to encode text. Ensure it contains valid characters.');
        }
    };

    const decodeText = () => {
        if (!textInput) return;
        try {
            const decoded = atob(textInput);
            setResult(decoded);
        } catch (error) {
            alert('Invalid Base64 string');
        }
    };

    const decodeToFile = () => {
        if (!textInput) return;
        try {
            // Extract data from data URL if present
            let base64Data = textInput;
            let mimeType = 'application/octet-stream';

            if (textInput.includes('data:')) {
                const matches = textInput.match(/^data:(.+);base64,(.+)$/);
                if (matches) {
                    mimeType = matches[1];
                    base64Data = matches[2];
                }
            }

            const byteCharacters = atob(base64Data);
            const byteArray = new Uint8Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteArray[i] = byteCharacters.charCodeAt(i);
            }
            const blob = new Blob([byteArray], { type: mimeType });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = 'decoded-file';
            a.click();
            setResult('File downloaded successfully!');
        } catch (error) {
            alert('Invalid Base64 string for file');
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(result);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const reset = () => {
        setFile(null);
        setTextInput('');
        setResult('');
        setCopied(false);
    };

    return (
        <div className="base64-tool-page">
            <Helmet>
                <title>Free Base64 Encoder & Decoder Online | ClarifyAll</title>
                <meta name="description" content="Encode and decode Base64 strings online for free. Convert files to Base64 or decode Base64 to files. Fast, secure, and easy to use." />
            </Helmet>

            <div className="base64-header">
                <h1>Base64 Encoder & Decoder</h1>
                <p>Encode files or text to Base64, or decode Base64 strings back to their original format.</p>
            </div>

            <div className="base64-toggle-container">
                <button
                    className={`base64-toggle-btn ${mode === 'encode' ? 'active' : ''}`}
                    onClick={() => { setMode('encode'); reset(); }}
                >
                    <Code size={18} />
                    Encode
                </button>
                <button
                    className={`base64-toggle-btn ${mode === 'decode' ? 'active' : ''}`}
                    onClick={() => { setMode('decode'); reset(); }}
                >
                    <FileText size={18} />
                    Decode
                </button>
            </div>

            <div className="base64-card">
                {mode === 'encode' ? (
                    <>
                        <div
                            className={`base64-upload-zone ${isDragging ? 'dragging' : ''}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => document.getElementById('base64-input').click()}
                        >
                            <div className="base64-upload-icon">
                                <Upload size={28} />
                            </div>
                            <p className="font-semibold text-lg mb-1">Drop file to encode or click to browse</p>
                            <p className="text-gray-500 text-sm">Any file type supported</p>
                            <input
                                id="base64-input"
                                type="file"
                                onChange={handleFileInput}
                                style={{ display: 'none' }}
                            />
                        </div>

                        <div className="base64-divider">OR</div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Encode Text:</label>
                            <textarea
                                className="base64-textarea"
                                placeholder="Enter text to encode..."
                                value={textInput}
                                onChange={(e) => setTextInput(e.target.value)}
                                rows={4}
                            />
                            <button onClick={encodeText} className="base64-action-btn" disabled={!textInput}>
                                <Code size={20} />
                                Encode Text
                            </button>
                        </div>
                    </>
                ) : (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Base64 String:</label>
                        <textarea
                            className="base64-textarea"
                            placeholder="Paste Base64 string to decode..."
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            rows={6}
                        />
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <button onClick={decodeText} className="base64-action-btn mt-0" disabled={!textInput}>
                                <FileText size={20} />
                                Decode to Text
                            </button>
                            <button onClick={decodeToFile} className="base64-action-btn mt-0 bg-gray-600 hover:bg-gray-700" disabled={!textInput}>
                                <Download size={20} />
                                Decode to File
                            </button>
                        </div>
                    </div>
                )}

                {result && (
                    <div className="base64-result-container">
                        <div className="flex items-center gap-2 text-green-600 font-medium mb-4">
                            <CheckCircle size={20} />
                            {mode === 'encode' ? 'Encoded successfully!' : 'Decoded successfully!'}
                        </div>

                        {result.length < 1000000 ? (
                            <div>
                                <div className="base64-copy-header">
                                    <span className="font-medium text-gray-700">Result:</span>
                                    <button onClick={copyToClipboard} className="base64-copy-btn">
                                        {copied ? <CheckCircle size={16} className="text-green-600" /> : <Copy size={16} />}
                                        {copied ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>
                                <textarea
                                    className="base64-textarea bg-gray-50"
                                    value={result}
                                    readOnly
                                    rows={8}
                                />
                            </div>
                        ) : (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                                <p className="text-yellow-800 mb-3">
                                    Result is too large to display ({(result.length / 1024 / 1024).toFixed(2)} MB).
                                </p>
                                <button onClick={copyToClipboard} className="base64-action-btn mt-0 w-auto inline-flex px-6">
                                    <Copy size={20} />
                                    Copy to Clipboard
                                </button>
                            </div>
                        )}

                        <button
                            className="w-full mt-6 py-3 border border-gray-300 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                            onClick={reset}
                        >
                            <RefreshCw size={18} />
                            Reset
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Base64Tool;
