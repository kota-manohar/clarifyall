import React, { useState, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import {
    GitCompare,
    Copy,
    FileText,
    Upload,
    Trash2,
    Download,
    Save,
    Share2,
    Info
} from 'lucide-react';
import '../../styles/TextDiff.css';

const TextDiff = () => {
    const [originalText, setOriginalText] = useState('');
    const [modifiedText, setModifiedText] = useState('');
    const [diffRows, setDiffRows] = useState([]);
    const [stats, setStats] = useState({ removals: 0, additions: 0 });
    const [showDiff, setShowDiff] = useState(false);

    // Refs for scrolling sync
    const leftColRef = useRef(null);
    const rightColRef = useRef(null);

    const handleScroll = (sourceRef, targetRef) => {
        if (sourceRef.current && targetRef.current) {
            targetRef.current.scrollTop = sourceRef.current.scrollTop;
        }
    };

    const handleFileUpload = (e, setText) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => setText(event.target.result);
            reader.readAsText(file);
        }
    };

    // Simple word-level diff (tokenization)
    const computeInlineDiff = (oldText, newText) => {
        if (oldText === newText) return { left: oldText, right: newText };

        // Very basic word/segment diff logic
        // For a robust implementation, a library like 'diff' is recommended.
        // Here we highlight the whole line change if different, but try to find common prefix/suffix

        let prefixLen = 0;
        while (prefixLen < oldText.length && prefixLen < newText.length && oldText[prefixLen] === newText[prefixLen]) {
            prefixLen++;
        }

        let suffixLen = 0;
        while (suffixLen < (oldText.length - prefixLen) && suffixLen < (newText.length - prefixLen) &&
            oldText[oldText.length - 1 - suffixLen] === newText[newText.length - 1 - suffixLen]) {
            suffixLen++;
        }

        const oldChange = oldText.substring(prefixLen, oldText.length - suffixLen);
        const newChange = newText.substring(prefixLen, newText.length - suffixLen);

        const commonPrefix = oldText.substring(0, prefixLen);
        const commonSuffix = oldText.substring(oldText.length - suffixLen);

        return {
            left: (
                <>
                    {commonPrefix}
                    <span className="highlight-red">{oldChange}</span>
                    {commonSuffix}
                </>
            ),
            right: (
                <>
                    {commonPrefix}
                    <span className="highlight-green">{newChange}</span>
                    {commonSuffix}
                </>
            )
        };
    };

    const calculateDiff = () => {
        const originalLines = originalText.split('\n');
        const modifiedLines = modifiedText.split('\n');
        const rows = [];
        let removals = 0;
        let additions = 0;

        // Simple line-by-line comparison - matching lines by index for this specific "side by side" view request
        // ideally properly LCS algorithm for lines would be better for realigning
        const maxLength = Math.max(originalLines.length, modifiedLines.length);

        for (let i = 0; i < maxLength; i++) {
            const original = originalLines[i];
            const modified = modifiedLines[i];
            const originalLineNum = i < originalLines.length ? i + 1 : '';
            const modifiedLineNum = i < modifiedLines.length ? i + 1 : '';

            if (original === modified) {
                // Unchanged
                rows.push({
                    type: 'unchanged',
                    leftLine: originalLineNum,
                    rightLine: modifiedLineNum,
                    leftContent: original,
                    rightContent: modified
                });
            } else if (original !== undefined && modified !== undefined) {
                // Modified line
                const { left, right } = computeInlineDiff(original, modified);
                rows.push({
                    type: 'modified',
                    leftLine: originalLineNum,
                    rightLine: modifiedLineNum,
                    leftContent: left,
                    rightContent: right
                });
                removals++;
                additions++;
            } else if (original !== undefined) {
                // Removed line
                rows.push({
                    type: 'removed',
                    leftLine: originalLineNum,
                    rightLine: '',
                    leftContent: original,
                    rightContent: ''
                });
                removals++;
            } else if (modified !== undefined) {
                // Added line
                rows.push({
                    type: 'added',
                    leftLine: '',
                    rightLine: modifiedLineNum,
                    leftContent: '',
                    rightContent: modified
                });
                additions++;
            }
        }

        setStats({ removals, additions });
        setDiffRows(rows);
        setShowDiff(true);
    };

    const clearAll = () => {
        setOriginalText('');
        setModifiedText('');
        setDiffRows([]);
        setShowDiff(false);
    };

    return (
        <div className="text-diff-page">
            <Helmet>
                <title>Free Text Diff Checker Online | Compare Text | ClarifyAll</title>
                <meta name="description" content="Compare two text blocks and find differences side-by-side with word-level highlighting." />
            </Helmet>

            <div className="diff-header-section">
                <div className="diff-title">Untitled diff</div>
                <div className="diff-actions">
                    <button onClick={clearAll} className="action-btn btn-clear">Clear</button>
                    <button className="action-btn btn-export"><Download size={16} /> Export</button>
                    <button className="action-btn btn-save"><Save size={16} /> Save</button>
                    <button className="action-btn btn-share"><Share2 size={16} /> Share</button>
                    <button className="action-btn btn-explain"><Info size={16} /> Explain</button>
                </div>
            </div>

            {!showDiff ? (
                <div className="input-area-wrapper">
                    <div className="diff-inputs-grid">
                        <div className="diff-input-col">
                            <h3>Original Text</h3>
                            <textarea
                                className="editor-textarea"
                                value={originalText}
                                onChange={(e) => setOriginalText(e.target.value)}
                                placeholder="Paste original text here..."
                            />
                            <div style={{ marginTop: '0.5rem' }}>
                                <label className="action-btn btn-clear" style={{ display: 'inline-flex' }}>
                                    <Upload size={14} /> Upload File
                                    <input type="file" hidden onChange={(e) => handleFileUpload(e, setOriginalText)} />
                                </label>
                            </div>
                        </div>
                        <div className="diff-input-col">
                            <h3>Modified Text</h3>
                            <textarea
                                className="editor-textarea"
                                value={modifiedText}
                                onChange={(e) => setModifiedText(e.target.value)}
                                placeholder="Paste modified text here..."
                            />
                            <div style={{ marginTop: '0.5rem' }}>
                                <label className="action-btn btn-clear" style={{ display: 'inline-flex' }}>
                                    <Upload size={14} /> Upload File
                                    <input type="file" hidden onChange={(e) => handleFileUpload(e, setModifiedText)} />
                                </label>
                            </div>
                        </div>
                    </div>
                    <button onClick={calculateDiff} className="compare-action-btn">
                        <GitCompare size={20} style={{ display: 'inline', marginRight: '8px' }} />
                        Find Difference
                    </button>
                </div>
            ) : (
                <>
                    <div className="stats-row">
                        <div className="stat-group">
                            <span className="stat-badge badge-removals">
                                <span style={{ fontSize: '18px', lineHeight: '10px' }}>-</span>
                                {stats.removals} removals
                            </span>
                            <span className="stat-meta"> {diffRows.length} lines</span>
                        </div>
                        <div className="stat-group">
                            <span className="stat-badge badge-additions">
                                <span style={{ fontSize: '18px', lineHeight: '10px' }}>+</span>
                                {stats.additions} additions
                            </span>
                            <span className="stat-meta"> {diffRows.length} lines</span>
                        </div>
                    </div>

                    <div className="diff-viewer-container">
                        {/* Left Column (Original/Removals) */}
                        <div className="diff-column left" ref={leftColRef} onScroll={() => handleScroll(leftColRef, rightColRef)}>
                            {diffRows.map((row, idx) => (
                                <div key={`left-${idx}`} className={`diff-line ${row.type === 'removed' || row.type === 'modified' ? 'removed' : ''}`}>
                                    <div className="line-number">{row.leftLine}</div>
                                    <div className="line-content">
                                        {row.type === 'added' ? '' : row.leftContent}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Right Column (Modified/Additions) */}
                        <div className="diff-column right" ref={rightColRef} onScroll={() => handleScroll(rightColRef, leftColRef)}>
                            {diffRows.map((row, idx) => (
                                <div key={`right-${idx}`} className={`diff-line ${row.type === 'added' || row.type === 'modified' ? 'added' : ''}`}>
                                    <div className="line-number">{row.rightLine}</div>
                                    <div className="line-content">
                                        {row.type === 'removed' ? '' : row.rightContent}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button onClick={clearAll} className="compare-action-btn" style={{ background: '#6b7280', marginTop: '2rem' }}>
                        New Comparison
                    </button>
                </>
            )}
        </div>
    );
};

export default TextDiff;
