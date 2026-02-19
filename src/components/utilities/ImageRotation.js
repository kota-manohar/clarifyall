import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Download, Upload, RotateCw, FlipHorizontal, FlipVertical, CheckCircle, Image as ImageIcon } from 'lucide-react';
import '../../styles/Utilities.css';

const ImageRotation = () => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [rotation, setRotation] = useState(0);
    const [flipH, setFlipH] = useState(false);
    const [flipV, setFlipV] = useState(false);
    const [processedUrl, setProcessedUrl] = useState(null);
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
        if (droppedFile && droppedFile.type.startsWith('image/')) {
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
        const url = URL.createObjectURL(selectedFile);
        setPreview(url);
        setRotation(0);
        setFlipH(false);
        setFlipV(false);
        setProcessedUrl(null);
    };

    const rotate90 = () => {
        setRotation((prev) => (prev + 90) % 360);
    };

    const toggleFlipH = () => {
        setFlipH(!flipH);
    };

    const toggleFlipV = () => {
        setFlipV(!flipV);
    };

    const applyTransformations = () => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Adjust canvas size based on rotation
            if (rotation === 90 || rotation === 270) {
                canvas.width = img.height;
                canvas.height = img.width;
            } else {
                canvas.width = img.width;
                canvas.height = img.height;
            }

            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
            ctx.drawImage(img, -img.width / 2, -img.height / 2);
            ctx.restore();

            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                setProcessedUrl(url);
            }, file.type);
        };
        img.src = preview;
    };

    const downloadImage = () => {
        const a = document.createElement('a');
        a.href = processedUrl;
        a.download = `rotated_${file.name}`;
        a.click();
    };

    const reset = () => {
        setFile(null);
        setPreview(null);
        setRotation(0);
        setFlipH(false);
        setFlipV(false);
        setProcessedUrl(null);
    };

    return (
        <div className="converter-page">
            <Helmet>
                <title>Free Image Rotation & Flip Tool Online | ClarifyAll</title>
                <meta name="description" content="Rotate and flip images online for free. 90°, 180°, 270° rotation. Horizontal and vertical flip. Supports JPG, PNG, WebP." />
                <meta name="keywords" content="rotate image, flip image, image rotation, rotate photo, flip photo online, rotate 90 degrees, image editor" />
                <meta property="og:title" content="Free Image Rotation & Flip Tool" />
                <meta property="og:description" content="Rotate and flip images instantly online." />
                <link rel="canonical" href="https://clarifyall.com/tools/image-rotation" />
            </Helmet>

            <div className="converter-container">
                <div className="converter-header">
                    <h1>Rotate & Flip Images</h1>
                    <p>Rotate images by 90°, 180°, or 270°. Flip horizontally or vertically. Free and easy.</p>
                </div>

                {!file ? (
                    <div className="converter-card">
                        <div
                            className={`upload-zone ${isDragging ? 'dragging' : ''}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => document.getElementById('rotation-input').click()}
                        >
                            <div className="upload-icon-wrapper">
                                <Upload size={32} />
                            </div>
                            <p className="upload-title">Drop your image here</p>
                            <p className="upload-subtitle">or click to browse • JPG, PNG, WebP</p>
                            <input
                                id="rotation-input"
                                type="file"
                                accept="image/*"
                                onChange={handleFileInput}
                                style={{ display: 'none' }}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="converter-card">
                        <div className="image-preview-single">
                            <img
                                src={preview}
                                alt="Preview"
                                style={{
                                    transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                                    maxWidth: '100%',
                                    maxHeight: '400px',
                                    transition: 'transform 0.3s ease',
                                }}
                            />
                        </div>

                        <div className="rotation-controls">
                            <button onClick={rotate90} className="control-btn">
                                <RotateCw size={20} />
                                Rotate 90°
                            </button>
                            <button onClick={toggleFlipH} className={`control-btn ${flipH ? 'active' : ''}`}>
                                <FlipHorizontal size={20} />
                                Flip H
                            </button>
                            <button onClick={toggleFlipV} className={`control-btn ${flipV ? 'active' : ''}`}>
                                <FlipVertical size={20} />
                                Flip V
                            </button>
                        </div>

                        <div className="transform-info">
                            <p>Rotation: {rotation}° | Flip H: {flipH ? 'Yes' : 'No'} | Flip V: {flipV ? 'Yes' : 'No'}</p>
                        </div>

                        {!processedUrl && (
                            <button onClick={applyTransformations} className="convert-button">
                                <CheckCircle size={20} />
                                Apply Transformations
                            </button>
                        )}

                        {processedUrl && (
                            <>
                                <div className="success-message">
                                    <CheckCircle size={20} />
                                    Image transformed successfully!
                                </div>
                                <button onClick={downloadImage} className="convert-button">
                                    <Download size={20} />
                                    Download Image
                                </button>
                            </>
                        )}

                        <button className="secondary-button" onClick={reset}>
                            Transform Another Image
                        </button>
                    </div>
                )}

                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">
                            <RotateCw size={24} />
                        </div>
                        <h3>Easy Rotation</h3>
                        <p>Rotate images by 90°, 180°, or 270° with one click.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <FlipHorizontal size={24} />
                        </div>
                        <h3>Flip Options</h3>
                        <p>Flip images horizontally or vertically for mirror effects.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <ImageIcon size={24} />
                        </div>
                        <h3>All Formats</h3>
                        <p>Works with JPG, PNG, WebP, and other image formats.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageRotation;
