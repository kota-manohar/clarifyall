import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Copy, Type, CheckCircle } from 'lucide-react';
import '../../styles/Utilities.css';

const CaseConverter = () => {
    const [text, setText] = useState('');
    const [result, setResult] = useState('');
    const [copied, setCopied] = useState(false);
    const [activeCase, setActiveCase] = useState('');

    const convertCase = (type) => {
        let converted = '';
        setActiveCase(type);

        switch (type) {
            case 'upper':
                converted = text.toUpperCase();
                break;
            case 'lower':
                converted = text.toLowerCase();
                break;
            case 'title':
                converted = text.replace(/\w\S*/g, (txt) =>
                    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
                );
                break;
            case 'sentence':
                converted = text.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, (c) =>
                    c.toUpperCase()
                );
                break;
            case 'camel':
                converted = text
                    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
                        index === 0 ? word.toLowerCase() : word.toUpperCase()
                    )
                    .replace(/\s+/g, '');
                break;
            case 'snake':
                converted = text
                    .replace(/\s+/g, '_')
                    .replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
                    .replace(/^_/, '')
                    .toLowerCase();
                break;
            case 'kebab':
                converted = text
                    .replace(/\s+/g, '-')
                    .replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
                    .replace(/^-/, '')
                    .toLowerCase();
                break;
            default:
                converted = text;
        }

        setResult(converted);
        setCopied(false);
    };

    const copyResult = () => {
        navigator.clipboard.writeText(result);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const clearText = () => {
        setText('');
        setResult('');
        setActiveCase('');
    };

    return (
        <div className="converter-page">
            <Helmet>
                <title>Free Case Converter Online | Text Case Changer | ClarifyAll</title>
                <meta name="description" content="Convert text to UPPERCASE, lowercase, Title Case, camelCase, snake_case, and more. Free online case converter tool." />
                <meta name="keywords" content="case converter, text case, uppercase, lowercase, title case, camelcase, snake case, kebab case" />
                <meta property="og:title" content="Free Case Converter Tool" />
                <meta property="og:description" content="Convert text to any case format instantly. Free and easy to use." />
                <link rel="canonical" href="https://clarifyall.com/tools/case-converter" />
            </Helmet>

            <div className="converter-container">
                <div className="converter-header">
                    <h1>Case Converter</h1>
                    <p>Convert text to different case formats instantly.</p>
                </div>

                <div className="converter-card">
                    <div className="text-input-section">
                        <label className="input-label">
                            <Type size={16} />
                            Enter Text:
                        </label>
                        <textarea
                            className="text-input"
                            placeholder="Type or paste your text here..."
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            rows={6}
                        />
                    </div>

                    <div className="case-buttons-grid">
                        <button
                            onClick={() => convertCase('upper')}
                            className={`case-button ${activeCase === 'upper' ? 'active' : ''}`}
                            disabled={!text}
                        >
                            UPPERCASE
                        </button>
                        <button
                            onClick={() => convertCase('lower')}
                            className={`case-button ${activeCase === 'lower' ? 'active' : ''}`}
                            disabled={!text}
                        >
                            lowercase
                        </button>
                        <button
                            onClick={() => convertCase('title')}
                            className={`case-button ${activeCase === 'title' ? 'active' : ''}`}
                            disabled={!text}
                        >
                            Title Case
                        </button>
                        <button
                            onClick={() => convertCase('sentence')}
                            className={`case-button ${activeCase === 'sentence' ? 'active' : ''}`}
                            disabled={!text}
                        >
                            Sentence case
                        </button>
                        <button
                            onClick={() => convertCase('camel')}
                            className={`case-button ${activeCase === 'camel' ? 'active' : ''}`}
                            disabled={!text}
                        >
                            camelCase
                        </button>
                        <button
                            onClick={() => convertCase('snake')}
                            className={`case-button ${activeCase === 'snake' ? 'active' : ''}`}
                            disabled={!text}
                        >
                            snake_case
                        </button>
                        <button
                            onClick={() => convertCase('kebab')}
                            className={`case-button ${activeCase === 'kebab' ? 'active' : ''}`}
                            disabled={!text}
                        >
                            kebab-case
                        </button>
                    </div>

                    {result && (
                        <>
                            <div className="text-input-section">
                                <label className="input-label">Result:</label>
                                <textarea
                                    className="text-input"
                                    value={result}
                                    readOnly
                                    rows={6}
                                />
                            </div>

                            <div className="success-message">
                                <CheckCircle size={20} />
                                Text converted successfully!
                            </div>

                            <div className="button-group">
                                <button onClick={copyResult} className="convert-button">
                                    <Copy size={20} />
                                    {copied ? 'Copied!' : 'Copy Result'}
                                </button>
                                <button onClick={clearText} className="secondary-button">
                                    Clear
                                </button>
                            </div>
                        </>
                    )}
                </div>

                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">
                            <Type size={24} />
                        </div>
                        <h3>7 Case Formats</h3>
                        <p>Convert to UPPER, lower, Title, Sentence, camel, snake, or kebab case.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <CheckCircle size={24} />
                        </div>
                        <h3>Instant Conversion</h3>
                        <p>One-click conversion to any case format.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <Copy size={24} />
                        </div>
                        <h3>Easy Copy</h3>
                        <p>Copy converted text to clipboard with one click.</p>
                    </div>
                </div>

                <div className="how-it-works">
                    <h2>How to Use</h2>
                    <div className="steps-grid">
                        <div className="step">
                            <div className="step-number">1</div>
                            <p>Enter your text</p>
                        </div>
                        <div className="step">
                            <div className="step-number">2</div>
                            <p>Click desired case format</p>
                        </div>
                        <div className="step">
                            <div className="step-number">3</div>
                            <p>Copy the result</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CaseConverter;
