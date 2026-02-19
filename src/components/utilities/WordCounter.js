import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Copy, FileText, Clock, Hash, AlignLeft, Type, Quote, Trash2, CheckCircle } from 'lucide-react';
import '../../styles/WordCounter.css';

const WordCounter = () => {
    const [text, setText] = useState('');
    const [stats, setStats] = useState({
        words: 0,
        characters: 0,
        charactersNoSpaces: 0,
        sentences: 0,
        paragraphs: 0,
        readingTime: 0
    });
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        calculateStats();
    }, [text]);

    const calculateStats = () => {
        if (!text) {
            setStats({
                words: 0,
                characters: 0,
                charactersNoSpaces: 0,
                sentences: 0,
                paragraphs: 0,
                readingTime: 0
            });
            return;
        }

        // Words
        const words = text.trim().split(/\s+/).filter(word => word.length > 0).length;

        // Characters
        const characters = text.length;
        const charactersNoSpaces = text.replace(/\s/g, '').length;

        // Sentences
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;

        // Paragraphs
        const paragraphs = text.split(/\n+/).filter(p => p.trim().length > 0).length;

        // Reading time (avg 200 words per minute)
        const readingTime = Math.ceil(words / 200);

        setStats({
            words,
            characters,
            charactersNoSpaces,
            sentences,
            paragraphs,
            readingTime
        });
    };

    const copyText = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const clearText = () => {
        setText('');
    };

    return (
        <div className="word-counter-page">
            <Helmet>
                <title>Free Word Counter Online | Character & Sentence Counter | ClarifyAll</title>
                <meta name="description" content="Count words, characters, sentences, and paragraphs instantly. Free online word counter with reading time estimator." />
                <meta name="keywords" content="word counter, character counter, sentence counter, paragraph counter, reading time, word count tool" />
                <meta property="og:title" content="Free Word Counter Tool" />
                <meta property="og:description" content="Count words, characters, and sentences in real-time. Free and easy to use." />
                <link rel="canonical" href="https://clarifyall.com/tools/word-counter" />
            </Helmet>

            <div className="word-counter-header">
                <h1>Word Counter</h1>
                <p>Count words, characters, sentences, paragraphs, and estimate reading time.</p>
            </div>

            <div className="word-counter-card">
                <div className="word-counter-stats">
                    <div className="word-stat-card">
                        <div className="word-stat-icon bg-blue-50 text-blue-600">
                            <FileText size={20} />
                        </div>
                        <div className="word-stat-value text-blue-600">{stats.words}</div>
                        <div className="word-stat-label">Words</div>
                    </div>
                    <div className="word-stat-card">
                        <div className="word-stat-icon bg-green-50 text-green-600">
                            <Type size={20} />
                        </div>
                        <div className="word-stat-value text-green-600">{stats.characters}</div>
                        <div className="word-stat-label">Characters</div>
                    </div>
                    <div className="word-stat-card">
                        <div className="word-stat-icon bg-purple-50 text-purple-600">
                            <Hash size={20} />
                        </div>
                        <div className="word-stat-value text-purple-600">{stats.charactersNoSpaces}</div>
                        <div className="word-stat-label">No Spaces</div>
                    </div>
                    <div className="word-stat-card">
                        <div className="word-stat-icon bg-orange-50 text-orange-600">
                            <AlignLeft size={20} />
                        </div>
                        <div className="word-stat-value text-orange-600">{stats.sentences}</div>
                        <div className="word-stat-label">Sentences</div>
                    </div>
                    <div className="word-stat-card">
                        <div className="word-stat-icon bg-pink-50 text-pink-600">
                            <Quote size={20} />
                        </div>
                        <div className="word-stat-value text-pink-600">{stats.paragraphs}</div>
                        <div className="word-stat-label">Paragraphs</div>
                    </div>
                    <div className="word-stat-card">
                        <div className="word-stat-icon bg-teal-50 text-teal-600">
                            <Clock size={20} />
                        </div>
                        <div className="word-stat-value text-teal-600">{stats.readingTime}m</div>
                        <div className="word-stat-label">Read Time</div>
                    </div>
                </div>

                <div className="word-input-section">
                    <label className="word-input-label">
                        <FileText size={16} className="text-gray-500" />
                        Enter Your Text:
                    </label>
                    <textarea
                        className="word-textarea"
                        placeholder="Start typing or paste your text here..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        rows={10}
                    />
                </div>

                {text && (
                    <div className="word-actions">
                        <button onClick={clearText} className="word-btn word-btn-secondary">
                            <Trash2 size={16} />
                            Clear
                        </button>
                        <button onClick={copyText} className="word-btn word-btn-primary">
                            {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                            {copied ? 'Copied!' : 'Copy Text'}
                        </button>
                    </div>
                )}
            </div>

            <div className="word-features">
                <div className="word-feature-card">
                    <div className="word-feature-icon">
                        <FileText size={24} />
                    </div>
                    <h3>Real-Time Counting</h3>
                    <p>See word and character counts update as you type.</p>
                </div>
                <div className="word-feature-card">
                    <div className="word-feature-icon">
                        <Clock size={24} />
                    </div>
                    <h3>Reading Time</h3>
                    <p>Estimate reading time based on average reading speed.</p>
                </div>
                <div className="word-feature-card">
                    <div className="word-feature-icon">
                        <Hash size={24} />
                    </div>
                    <h3>Detailed Stats</h3>
                    <p>Track words, characters, sentences, and paragraphs.</p>
                </div>
            </div>
        </div>
    );
};

export default WordCounter;
