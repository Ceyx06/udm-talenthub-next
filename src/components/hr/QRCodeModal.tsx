// components/hr/QRCodeModal.tsx
'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';

interface QRCodeModalProps {
    vacancy: {
        id: string;
        title: string;
        college: string;
    };
    onClose: () => void;
}

export default function QRCodeModal({ vacancy, onClose }: QRCodeModalProps) {
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [copySuccess, setCopySuccess] = useState(false);

    // Get the public URL - matches the format from your page.tsx
    const getPublicLink = () => {
        const base =
            process.env.NEXT_PUBLIC_APP_URL ||
            process.env.NEXT_PUBLIC_BASE_URL ||
            (typeof window !== 'undefined' ? window.location.origin : '');

        // Use the same format as your copyPublicLink function
        return `${base}/apply?vacancy=${vacancy.id}`;
    };

    useEffect(() => {
        generateQRCode();
    }, [vacancy.id]);

    const generateQRCode = async () => {
        setLoading(true);
        try {
            const publicJobLink = getPublicLink();

            // Log for debugging
            console.log('🔗 Generating QR code for:', publicJobLink);

            // Generate QR code with the public URL
            const qrDataUrl = await QRCode.toDataURL(publicJobLink, {
                width: 400,
                margin: 2,
                color: {
                    dark: '#1e3a8a', // Dark blue to match your theme
                    light: '#ffffff'
                },
                errorCorrectionLevel: 'M'
            });

            setQrCodeUrl(qrDataUrl);
        } catch (error) {
            console.error('❌ Error generating QR code:', error);
            alert('Failed to generate QR code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = async () => {
        try {
            const publicJobLink = getPublicLink();
            await navigator.clipboard.writeText(publicJobLink);
            setCopySuccess(true);

            // Reset after 2 seconds
            setTimeout(() => {
                setCopySuccess(false);
            }, 2000);
        } catch (error) {
            console.error('❌ Error copying to clipboard:', error);
            alert('Failed to copy link to clipboard!');
        }
    };

    const handleDownloadQR = () => {
        if (!qrCodeUrl) return;

        const link = document.createElement('a');
        link.download = `qr-${vacancy.title.replace(/\s+/g, '-').toLowerCase()}.png`;
        link.href = qrCodeUrl;
        link.click();
    };

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-8"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900">Job Posting QR Code</h3>
                        <p className="text-sm text-gray-500 mt-1">Share this code with applicants</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-3xl leading-none transition-colors"
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>

                {/* QR Code Display */}
                <div className="flex flex-col items-center">
                    <div className="bg-white p-6 rounded-lg border-2 border-gray-200 mb-6 shadow-sm">
                        {loading ? (
                            <div className="w-80 h-80 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            </div>
                        ) : qrCodeUrl ? (
                            <img
                                src={qrCodeUrl}
                                alt="Job QR Code"
                                className="w-80 h-80"
                            />
                        ) : (
                            <div className="w-80 h-80 flex items-center justify-center text-red-500">
                                Failed to generate QR code
                            </div>
                        )}
                    </div>

                    {/* Job Info */}
                    <div className="text-center mb-4 w-full">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Job Position</p>
                        <p className="font-bold text-xl text-gray-900 mb-1">{vacancy.title}</p>
                        <p className="text-sm text-gray-600">{vacancy.college}</p>
                    </div>

                    {/* Public Link Display */}
                    <div className="w-full bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">
                                Public Application Link
                            </p>
                            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded font-medium">
                                ✓ Live
                            </span>
                        </div>
                        <div className="bg-white p-3 rounded border border-gray-200">
                            <p className="text-xs font-mono break-all text-gray-700">
                                {getPublicLink()}
                            </p>
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="w-full bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <p className="text-sm text-blue-800">
                            <span className="font-semibold">📱 How to use:</span> Applicants can scan this QR code
                            with their phone camera or any QR code reader to directly access the application form.
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 w-full">
                        <button
                            onClick={copyToClipboard}
                            className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${copySuccess
                                    ? 'bg-green-500 text-white'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                        >
                            {copySuccess ? '✓ Copied!' : 'Copy Link'}
                        </button>
                        <button
                            onClick={handleDownloadQR}
                            disabled={!qrCodeUrl || loading}
                            className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Download QR
                        </button>
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="mt-3 w-full px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}