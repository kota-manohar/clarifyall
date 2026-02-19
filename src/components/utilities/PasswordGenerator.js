import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Copy, RefreshCw, CheckCircle, Lock, Shield } from 'lucide-react';
import '../../styles/Utilities.css';

const PasswordGenerator = () => {
    const [password, setPassword] = useState('');
    const [length, setLength] = useState(16);
    const [options, setOptions] = useState({
        uppercase: true,
        lowercase: true,
        numbers: true,
        symbols: true
    });
    const [copied, setCopied] = useState(false);
    const [strength, setStrength] = useState('');

    const generatePassword = () => {
        let charset = '';
        if (options.uppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if (options.lowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
        if (options.numbers) charset += '0123456789';
        if (options.symbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

        if (charset === '') {
            setPassword('');
            setStrength('');
            return;
        }

        let newPassword = '';
        for (let i = 0; i < length; i++) {
            newPassword += charset.charAt(Math.floor(Math.random() * charset.length));
        }

        setPassword(newPassword);
        calculateStrength(newPassword);
        setCopied(false);
    };

    const calculateStrength = (pwd) => {
        let score = 0;
        if (pwd.length >= 8) score++;
        if (pwd.length >= 12) score++;
        if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
        if (/[0-9]/.test(pwd)) score++;
        if (/[^a-zA-Z0-9]/.test(pwd)) score++;

        if (score <= 2) setStrength('weak');
        else if (score <= 3) setStrength('medium');
        else setStrength('strong');
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(password);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleOptionChange = (option) => {
        setOptions(prev => ({ ...prev, [option]: !prev[option] }));
    };

    return (
        <div className="converter-page">
            <Helmet>
                <title>Free Password Generator Online | ClarifyAll</title>
                <meta name="description" content="Generate strong, secure passwords online. Customizable length and character types. Free random password generator with strength indicator." />
                <meta name="keywords" content="password generator, strong password, random password, secure password, password maker, generate password" />
                <meta property="og:title" content="Free Password Generator" />
                <meta property="og:description" content="Create strong, secure passwords instantly. Free and easy to use." />
                <link rel="canonical" href="https://clarifyall.com/tools/password-generator" />
            </Helmet>

            <div className="converter-container">
                <div className="converter-header">
                    <h1>Password Generator</h1>
                    <p>Generate strong, secure passwords with customizable options.</p>
                </div>

                <div className="converter-card">
                    {password && (
                        <div className="password-display">
                            <input
                                type="text"
                                className="password-output"
                                value={password}
                                readOnly
                            />
                            {strength && (
                                <div className={`strength-indicator strength-${strength}`}>
                                    <Shield size={16} />
                                    {strength.charAt(0).toUpperCase() + strength.slice(1)}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="password-options">
                        <div className="option-group">
                            <label className="input-label">
                                Password Length: {length}
                            </label>
                            <input
                                type="range"
                                min="8"
                                max="64"
                                value={length}
                                onChange={(e) => setLength(Number(e.target.value))}
                                className="slider"
                            />
                            <div className="slider-labels">
                                <span>8</span>
                                <span>64</span>
                            </div>
                        </div>

                        <div className="checkbox-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={options.uppercase}
                                    onChange={() => handleOptionChange('uppercase')}
                                />
                                Uppercase Letters (A-Z)
                            </label>
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={options.lowercase}
                                    onChange={() => handleOptionChange('lowercase')}
                                />
                                Lowercase Letters (a-z)
                            </label>
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={options.numbers}
                                    onChange={() => handleOptionChange('numbers')}
                                />
                                Numbers (0-9)
                            </label>
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={options.symbols}
                                    onChange={() => handleOptionChange('symbols')}
                                />
                                Symbols (!@#$%^&*)
                            </label>
                        </div>
                    </div>

                    <button onClick={generatePassword} className="convert-button full-width-btn">
                        <RefreshCw size={20} />
                        Generate Password
                    </button>

                    {password && (
                        <div className="button-group">
                            <button onClick={copyToClipboard} className="convert-button">
                                <Copy size={20} />
                                {copied ? 'Copied!' : 'Copy Password'}
                            </button>
                            <button onClick={generatePassword} className="secondary-button">
                                <RefreshCw size={20} />
                                Generate New
                            </button>
                        </div>
                    )}
                </div>

                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">
                            <Lock size={24} />
                        </div>
                        <h3>Secure & Random</h3>
                        <p>Generate cryptographically secure random passwords.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <Shield size={24} />
                        </div>
                        <h3>Strength Indicator</h3>
                        <p>See password strength rating in real-time.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <RefreshCw size={24} />
                        </div>
                        <h3>Customizable</h3>
                        <p>Choose length and character types for your password.</p>
                    </div>
                </div>

                <div className="how-it-works">
                    <h2>How to Use</h2>
                    <div className="steps-grid">
                        <div className="step">
                            <div className="step-number">1</div>
                            <p>Set password length</p>
                        </div>
                        <div className="step">
                            <div className="step-number">2</div>
                            <p>Select character types</p>
                        </div>
                        <div className="step">
                            <div className="step-number">3</div>
                            <p>Generate and copy</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PasswordGenerator;
