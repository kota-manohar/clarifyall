import React, { useState, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Download, Upload, Image as ImageIcon, CheckCircle } from 'lucide-react';
import '../../styles/Utilities.css';

const FaviconGenerator = () => {
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [faviconSizes, setFaviconSizes] = useState([]);
    const [generated, setGenerated] = useState(false);
    const canvasRef = useRef(null);

    const sizes = [16, 32, 48, 64, 128, 256];

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            setImage(file);
            const reader = new FileReader();
            reader.onload = (event) => {
                setImagePreview(event.target.result);
                setGenerated(false);
            };
            reader.readAsDataURL(file);
        }
    };

    const generateFavicons = () => {
        if (!imagePreview) return;

        const img = new Image();
        img.onload = () => {
            const generatedFavicons = sizes.map(size => {
                const canvas = document.createElement('canvas');
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, size, size);
                return {
                    size,
                    dataUrl: canvas.toDataURL('image/png')
                };
            });
            setFaviconSizes(generatedFavicons);
            setGenerated(true);
        };
        img.src = imagePreview;
    };

    const downloadFavicon = (dataUrl, size) => {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `favicon-${size}x${size}.png`;
        a.click();
    };

    const downloadAll = () => {
        faviconSizes.forEach((favicon, index) => {
            setTimeout(() => {
                downloadFavicon(favicon.dataUrl, favicon.size);
            }, index * 200);
        });
    };

    const reset = () => {
        setImage(null);
        setImagePreview(null);
        setFaviconSizes([]);
        setGenerated(false);
    };

    return (
        <div className="converter-page">
            <Helmet>
                <title>Free Favicon Generator Online | Create Favicons | ClarifyAll</title>
                <meta name="description" content="Generate favicons in multiple sizes from any image. Free favicon generator with instant download." />
                <meta name="keywords" content="favicon generator, create favicon, favicon maker, ico generator, website icon, favicon sizes" />
                <meta property="og:title" content="Free Favicon Generator" />
                <meta property="og:description" content="Create favicons in multiple sizes instantly. Free and easy to use." />
                <link rel="canonical" href="https://clarifyall.com/tools/favicon-generator" />
            </Helmet>

            <div className="converter-container">
                <div className="converter-header">
                    <h1>Favicon Generator</h1>
                    <p>Generate favicons in multiple sizes from your image.</p>
                </div>

                <div className="converter-card">
                    {!imagePreview ? (
                        <div className="upload-section">
                            <label className="input-label">
                                <ImageIcon size={16} />
                                Upload Image:
                            </label>
                            <div className="file-upload-box">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    style={{ display: 'none' }}
                                    id="favicon-upload"
                                />
                                <label htmlFor="favicon-upload" className="file-upload-label">
                                    <Upload size={32} />
                                    <span>Click to upload image</span>
                                    <small>PNG, JPG, or SVG recommended</small>
                                </label>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="image-preview-section">
                                <label className="input-label">Original Image:</label>
                                <img src={imagePreview} alt="Original" className="favicon-original-preview" />
                            </div>

                            {!generated && (
                                <button onClick={generateFavicons} className="convert-button">
                                    <ImageIcon size={20} />
                                    Generate Favicons
                                </button>
                            )}

                            {generated && faviconSizes.length > 0 && (
                                <>
                                    <div className="success-message">
                                        <CheckCircle size={20} />
                                        Favicons generated successfully!
                                    </div>

                                    <div className="favicon-grid">
                                        {faviconSizes.map((favicon) => (
                                            <div key={favicon.size} className="favicon-item">
                                                <img
                                                    src={favicon.dataUrl}
                                                    alt={`${favicon.size}x${favicon.size}`}
                                                    className="favicon-preview"
                                                    style={{ width: favicon.size, height: favicon.size }}
                                                />
                                                <span className="favicon-size">{favicon.size}×{favicon.size}</span>
                                                <button
                                                    onClick={() => downloadFavicon(favicon.dataUrl, favicon.size)}
                                                    className="favicon-download-btn"
                                                >
                                                    <Download size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="button-group">
                                        <button onClick={downloadAll} className="convert-button">
                                            <Download size={20} />
                                            Download All Sizes
                                        </button>
                                        <button onClick={reset} className="secondary-button">
                                            Upload New Image
                                        </button>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>

                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">
                            <ImageIcon size={24} />
                        </div>
                        <h3>Multiple Sizes</h3>
                        <p>Generate 16×16, 32×32, 48×48, 64×64, 128×128, and 256×256 favicons.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <Download size={24} />
                        </div>
                        <h3>Easy Download</h3>
                        <p>Download individual sizes or all sizes at once.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <CheckCircle size={24} />
                        </div>
                        <h3>High Quality</h3>
                        <p>PNG format with transparent background support.</p>
                    </div>
                </div>

                <div className="how-it-works">
                    <h2>How to Use</h2>
                    <div className="steps-grid">
                        <div className="step">
                            <div className="step-number">1</div>
                            <p>Upload your image</p>
                        </div>
                        <div className="step">
                            <div className="step-number">2</div>
                            <p>Generate favicons</p>
                        </div>
                        <div className="step">
                            <div className="step-number">3</div>
                            <p>Download all sizes</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FaviconGenerator;
