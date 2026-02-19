import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import QRCode from 'qrcode';
import { Download, Link as LinkIcon, Type, CheckCircle, Palette, Image as ImageIcon, Upload } from 'lucide-react';
import '../../styles/Utilities.css';

const QrCodeGenerator = () => {
    const [textInput, setTextInput] = useState('');
    const [size, setSize] = useState(300);
    const [fgColor, setFgColor] = useState('#000000');
    const [bgColor, setBgColor] = useState('#ffffff');
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [isGenerated, setIsGenerated] = useState(false);
    const [logoImage, setLogoImage] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const canvasRef = useRef(null);

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            setLogoImage(file);
            const reader = new FileReader();
            reader.onload = (event) => {
                setLogoPreview(event.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeLogo = () => {
        setLogoImage(null);
        setLogoPreview(null);
    };

    const generateQR = async () => {
        if (!textInput) return;

        try {
            const canvas = canvasRef.current;
            await QRCode.toCanvas(canvas, textInput, {
                width: size,
                margin: 2,
                color: {
                    dark: fgColor,
                    light: bgColor
                },
                errorCorrectionLevel: 'H' // High error correction for logo overlay
            });

            // If logo is present, overlay it on the QR code
            if (logoPreview) {
                const ctx = canvas.getContext('2d');
                const img = new Image();
                img.onload = () => {
                    // Logo size should be about 20% of QR code size
                    const logoSize = size * 0.2;
                    const logoX = (size - logoSize) / 2;
                    const logoY = (size - logoSize) / 2;

                    // Draw white background circle for logo
                    ctx.fillStyle = 'white';
                    ctx.beginPath();
                    ctx.arc(size / 2, size / 2, logoSize / 2 + 5, 0, 2 * Math.PI);
                    ctx.fill();

                    // Draw logo
                    ctx.drawImage(img, logoX, logoY, logoSize, logoSize);

                    const url = canvas.toDataURL();
                    setQrCodeUrl(url);
                    setIsGenerated(true);
                };
                img.src = logoPreview;
            } else {
                const url = canvas.toDataURL();
                setQrCodeUrl(url);
                setIsGenerated(true);
            }
        } catch (error) {
            console.error('QR generation error:', error);
        }
    };

    const downloadQR = () => {
        const a = document.createElement('a');
        a.href = qrCodeUrl;
        a.download = 'qrcode.png';
        a.click();
    };

    const reset = () => {
        setTextInput('');
        setSize(300);
        setFgColor('#000000');
        setBgColor('#ffffff');
        setQrCodeUrl('');
        setIsGenerated(false);
        setLogoImage(null);
        setLogoPreview(null);
    };

    return (
        <div className="converter-page">
            <Helmet>
                <title>Free QR Code Generator Online | ClarifyAll</title>
                <meta name="description" content="Generate QR codes online for free. Create QR codes from text or URLs. Customizable colors and size. Instant download as PNG." />
                <meta name="keywords" content="qr code generator, create qr code, qr code maker, generate qr code, free qr code, qr code online, custom qr code" />
                <meta property="og:title" content="Free QR Code Generator" />
                <meta property="og:description" content="Create custom QR codes instantly. Free and easy to use." />
                <link rel="canonical" href="https://clarifyall.com/tools/qr-code-generator" />
            </Helmet>

            <div className="converter-container">
                <div className="converter-header">
                    <h1>QR Code Generator</h1>
                    <p>Create QR codes from text or URLs. Customize colors and size. Download as PNG.</p>
                </div>

                <div className="converter-card">
                    {/* Hidden canvas for QR generation */}
                    <canvas ref={canvasRef} style={{ display: 'none' }} />

                    <div className="text-input-section">
                        <label className="input-label">
                            <Type size={16} />
                            Enter Text or URL:
                        </label>
                        <textarea
                            className="text-input"
                            placeholder="Enter text, URL, phone number, or any data to encode..."
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            rows={4}
                        />
                    </div>

                    <div className="qr-customization">
                        <h3 className="section-title">Customize Appearance</h3>
                        <div className="qr-settings">
                            <div className="setting-group">
                                <label className="input-label">QR Code Size</label>
                                <select
                                    className="select-input"
                                    value={size}
                                    onChange={(e) => setSize(Number(e.target.value))}
                                >
                                    <option value={200}>Small (200×200 px)</option>
                                    <option value={300}>Medium (300×300 px)</option>
                                    <option value={400}>Large (400×400 px)</option>
                                    <option value={500}>Extra Large (500×500 px)</option>
                                </select>
                            </div>

                            <div className="setting-group">
                                <label className="input-label">
                                    <Palette size={16} />
                                    Foreground Color
                                </label>
                                <div className="color-picker-wrapper">
                                    <input
                                        type="color"
                                        value={fgColor}
                                        onChange={(e) => setFgColor(e.target.value)}
                                        className="color-input"
                                    />
                                    <span className="color-value">{fgColor.toUpperCase()}</span>
                                </div>
                            </div>

                            <div className="setting-group">
                                <label className="input-label">
                                    <Palette size={16} />
                                    Background Color
                                </label>
                                <div className="color-picker-wrapper">
                                    <input
                                        type="color"
                                        value={bgColor}
                                        onChange={(e) => setBgColor(e.target.value)}
                                        className="color-input"
                                    />
                                    <span className="color-value">{bgColor.toUpperCase()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="logo-upload-section">
                            <label className="input-label">
                                <ImageIcon size={16} />
                                Add Logo (Optional)
                            </label>
                            {!logoPreview ? (
                                <div className="logo-upload-box">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoUpload}
                                        style={{ display: 'none' }}
                                        id="logo-upload"
                                    />
                                    <label htmlFor="logo-upload" className="logo-upload-label">
                                        <Upload size={20} />
                                        Click to upload logo
                                    </label>
                                </div>
                            ) : (
                                <div className="logo-preview-box">
                                    <img src={logoPreview} alt="Logo" className="logo-preview-img" />
                                    <button onClick={removeLogo} className="remove-logo-btn">
                                        ×
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {!isGenerated && (
                        <button
                            onClick={generateQR}
                            className="convert-button"
                            disabled={!textInput}
                        >
                            <LinkIcon size={20} />
                            Generate QR Code
                        </button>
                    )}

                    {isGenerated && qrCodeUrl && (
                        <>
                            <div className="qr-preview">
                                <img src={qrCodeUrl} alt="Generated QR Code" className="qr-image" />
                            </div>

                            <div className="success-message">
                                <CheckCircle size={20} />
                                QR Code generated successfully!
                            </div>

                            <div className="button-group">
                                <button onClick={downloadQR} className="convert-button">
                                    <Download size={20} />
                                    Download QR Code
                                </button>
                                <button onClick={reset} className="secondary-button">
                                    Generate New Code
                                </button>
                            </div>
                        </>
                    )}
                </div>

                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">
                            <LinkIcon size={24} />
                        </div>
                        <h3>URLs & Text</h3>
                        <p>Generate QR codes for websites, text, contact info, and more.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <Palette size={24} />
                        </div>
                        <h3>Custom Colors</h3>
                        <p>Personalize your QR code with custom foreground and background colors.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <Download size={24} />
                        </div>
                        <h3>Download PNG</h3>
                        <p>Save your QR code as a high-quality PNG image.</p>
                    </div>
                </div>

                <div className="how-it-works">
                    <h2>How to Use</h2>
                    <div className="steps-grid">
                        <div className="step">
                            <div className="step-number">1</div>
                            <p>Enter your text or URL</p>
                        </div>
                        <div className="step">
                            <div className="step-number">2</div>
                            <p>Customize size and colors</p>
                        </div>
                        <div className="step">
                            <div className="step-number">3</div>
                            <p>Download your QR code</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QrCodeGenerator;
