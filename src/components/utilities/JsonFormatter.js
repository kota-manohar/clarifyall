import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Copy, Download, CheckCircle, AlertCircle, Code, Minimize2, Maximize2 } from 'lucide-react';
import '../../styles/Utilities.css';

const JsonFormatter = () => {
    const [jsonInput, setJsonInput] = useState('');
    const [jsonOutput, setJsonOutput] = useState('');
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const [mode, setMode] = useState('beautify'); // beautify or minify

    const formatJson = () => {
        setError('');
        setJsonOutput('');

        try {
            const parsed = JSON.parse(jsonInput);

            if (mode === 'beautify') {
                setJsonOutput(JSON.stringify(parsed, null, 2));
            } else {
                setJsonOutput(JSON.stringify(parsed));
            }
        } catch (err) {
            setError(`Invalid JSON: ${err.message}`);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(jsonOutput);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const downloadJson = () => {
        const blob = new Blob([jsonOutput], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'formatted.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    const clear = () => {
        setJsonInput('');
        setJsonOutput('');
        setError('');
        setCopied(false);
    };

    return (
        <div className="converter-page">
            <Helmet>
                <title>Free JSON Formatter & Validator Online | ClarifyAll</title>
                <meta name="description" content="Format, beautify, and validate JSON online. Minify or prettify JSON with syntax validation. Free JSON formatter tool." />
                <meta name="keywords" content="json formatter, json validator, beautify json, minify json, json prettify, validate json, json online" />
                <meta property="og:title" content="Free JSON Formatter & Validator" />
                <meta property="og:description" content="Format and validate JSON instantly. Free and easy to use." />
                <link rel="canonical" href="https://clarifyall.com/tools/json-formatter" />
            </Helmet>

            <div className="converter-container">
                <div className="converter-header">
                    <h1>JSON Formatter & Validator</h1>
                    <p>Beautify, minify, and validate JSON with syntax checking.</p>
                </div>

                <div className="converter-card">
                    <div className="mode-toggle">
                        <button
                            className={`mode-button ${mode === 'beautify' ? 'active' : ''}`}
                            onClick={() => setMode('beautify')}
                        >
                            <Maximize2 size={18} />
                            Beautify
                        </button>
                        <button
                            className={`mode-button ${mode === 'minify' ? 'active' : ''}`}
                            onClick={() => setMode('minify')}
                        >
                            <Minimize2 size={18} />
                            Minify
                        </button>
                    </div>

                    <div className="text-input-section">
                        <label className="input-label">
                            <Code size={18} className="text-indigo-600" />
                            Enter JSON:
                        </label>
                        <textarea
                            className="text-input code-input"
                            placeholder='{"name": "John", "age": 30, "city": "New York"}'
                            value={jsonInput}
                            onChange={(e) => setJsonInput(e.target.value)}
                            rows={12}
                            spellCheck="false"
                        />
                    </div>

                    <button onClick={formatJson} className="convert-button full-width-btn" disabled={!jsonInput}>
                        <Code size={20} />
                        {mode === 'beautify' ? 'Format / Beautify JSON' : 'Minify / Compress JSON'}
                    </button>

                    {error && (
                        <div className="error-message">
                            <AlertCircle size={20} />
                            {error}
                        </div>
                    )}

                    {jsonOutput && (
                        <div className="output-section">
                            <div className="text-input-section">
                                <label className="input-label">
                                    <CheckCircle size={18} className="text-green-600" />
                                    Formatted Result:
                                </label>
                                <textarea
                                    className="text-input code-input"
                                    value={jsonOutput}
                                    readOnly
                                    rows={12}
                                    spellCheck="false"
                                />
                            </div>

                            <div className="success-message">
                                <CheckCircle size={20} />
                                JSON is valid and formatted successfully!
                            </div>

                            <div className="button-group">
                                <button onClick={copyToClipboard} className="convert-button">
                                    <Copy size={20} />
                                    {copied ? 'Copied!' : 'Copy JSON'}
                                </button>
                                <button onClick={downloadJson} className="secondary-button">
                                    <Download size={20} />
                                    Download JSON
                                </button>
                                <button onClick={clear} className="secondary-button">
                                    Clear
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">
                            <Maximize2 size={24} />
                        </div>
                        <h3>Beautify JSON</h3>
                        <p>Format JSON with proper indentation and line breaks for readability.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <Minimize2 size={24} />
                        </div>
                        <h3>Minify JSON</h3>
                        <p>Compress JSON by removing whitespace and line breaks.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <CheckCircle size={24} />
                        </div>
                        <h3>Validate Syntax</h3>
                        <p>Automatically detect and report JSON syntax errors.</p>
                    </div>
                </div>

                <div className="how-it-works">
                    <h2>How to Use</h2>
                    <div className="steps-grid">
                        <div className="step">
                            <div className="step-number">1</div>
                            <p>Paste your JSON code</p>
                        </div>
                        <div className="step">
                            <div className="step-number">2</div>
                            <p>Choose beautify or minify</p>
                        </div>
                        <div className="step">
                            <div className="step-number">3</div>
                            <p>Copy or download result</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JsonFormatter;
