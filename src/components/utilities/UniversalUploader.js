import React, { useState, useRef } from 'react';
import { Upload, File, X } from 'lucide-react';

const UniversalUploader = ({ onFileSelect, accept, maxSize = 10 * 1024 * 1024, multiple = false }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const validateFile = (file) => {
        // Check file size
        if (file.size > maxSize) {
            setError(`File size exceeds ${maxSize / (1024 * 1024)}MB limit.`);
            return false;
        }

        // Check file type if accept is provided
        if (accept) {
            const acceptedTypes = accept.split(',').map(type => type.trim());
            const fileType = file.type;
            const fileName = file.name.toLowerCase();

            const isValid = acceptedTypes.some(type => {
                if (type.startsWith('.')) {
                    return fileName.endsWith(type.toLowerCase());
                }
                if (type.endsWith('/*')) {
                    return fileType.startsWith(type.replace('/*', ''));
                }
                return fileType === type;
            });

            if (!isValid) {
                setError(`Invalid file type. Accepted: ${accept}`);
                return false;
            }
        }

        return true;
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        setError(null);

        const files = Array.from(e.dataTransfer.files);
        processFiles(files);
    };

    const handleFileInput = (e) => {
        const files = Array.from(e.target.files);
        processFiles(files);
    };

    const processFiles = (files) => {
        if (files.length === 0) return;

        if (!multiple && files.length > 1) {
            // If single file mode but multiple dropped, take first valid
            const file = files[0];
            if (validateFile(file)) {
                onFileSelect(file);
            }
        } else {
            // Multiple files or single file
            const validFiles = files.filter(validateFile);
            if (validFiles.length > 0) {
                if (multiple) {
                    onFileSelect(validFiles);
                } else {
                    onFileSelect(validFiles[0]);
                }
            }
        }
    };

    const handleClick = () => {
        fileInputRef.current.click();
    };

    return (
        <div
            className={`universal-uploader ${isDragging ? 'dragging' : ''}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={handleClick}
        >
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInput}
                accept={accept}
                multiple={multiple}
                className="file-input"
                style={{ display: 'none' }}
            />

            <div className="upload-content">
                <Upload className="upload-icon" size={48} />
                <div className="upload-text">
                    <h3>Drag & Drop files here</h3>
                    <p>or click to browse</p>
                    {accept && <p className="text-sm text-gray-500 mt-2">Supports: {accept}</p>}
                    <p className="text-sm text-gray-400 mt-1">Max size: {maxSize / (1024 * 1024)}MB</p>
                </div>
            </div>

            {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg flex items-center justify-center gap-2">
                    <X size={16} />
                    {error}
                </div>
            )}
        </div>
    );
};

export default UniversalUploader;
