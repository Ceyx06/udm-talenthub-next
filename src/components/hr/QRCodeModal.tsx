'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface Vacancy {
    id: string;
    title: string;
    college: string;
    postedDate: string;
}

interface QRCodeModalProps {
    vacancy: Vacancy;
    onClose: () => void;
}

export default function QRCodeModal({ vacancy, onClose }: QRCodeModalProps) {
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        generateQRCode();
    }, [vacancy.id]);

    const generateQRCode = async () => {
        try {
            setLoading(true);
            setError(null);

            // Get the base URL from environment variable or window
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
                (typeof window !== 'undefined' ? window.location.origin : '');

            // Create the public job URL - CHANGED to /jobs route
            const publicUrl = `${baseUrl}/jobs/${encodeURIComponent(vacancy.id)}`;

            // Generate QR code
            const qrDataUrl = await QRCode.toDataURL(publicUrl, {
                width: 300,
                margin: 2,
                color: {
                    dark: '#1e3a8a', // Navy blue to match your theme
                    light: '#ffffff',
                },
                errorCorrectionLevel: 'M',
            });

            setQrCodeDataUrl(qrDataUrl);
        } catch (err) {
            console.error('Error generating QR code:', err);
            setError('Failed to generate QR code');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        if (!qrCodeDataUrl) return;

        const link = document.createElement('a');
        link.download = `${vacancy.title.replace(/\s+/g, '-')}-QR-Code.png`;
        link.href = qrCodeDataUrl;
        link.click();
    };

    const handleCopyLink = async () => {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
            (typeof window !== 'undefined' ? window.location.origin : '');
        const publicUrl = `${baseUrl}/jobs/${encodeURIComponent(vacancy.id)}`;

        try {
            await navigator.clipboard.writeText(publicUrl);
            setCopied(true);
            // Reset copied state after 2 seconds
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
            alert('Failed to copy link to clipboard');
        }
    };

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">Job Posting QR Code</h2>
                        <p className="text-sm text-gray-500 mt-1">{vacancy.title}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
                            <p className="mt-4 text-gray-600">Generating QR code...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-8">
                            <div className="text-red-600 mb-4">
                                <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className="text-red-600 font-medium">{error}</p>
                            <button
                                onClick={generateQRCode}
                                className="mt-4 px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : (
                        <div className="text-center">
                            {/* QR Code Image */}
                            <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block">
                                <img
                                    src={qrCodeDataUrl}
                                    alt="Job Posting QR Code"
                                    className="w-full h-auto max-w-[300px]"
                                />
                            </div>

                            {/* Instructions */}
                            <p className="text-sm text-gray-600 mt-4">
                                Scan this QR code to view the job posting
                            </p>

                            {/* College Badge */}
                            <div className="mt-3">
                                <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                                    {vacancy.college}
                                </span>
                            </div>

                            {/* Public URL Display */}
                            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">Public Link:</p>
                                <p className="text-sm text-gray-700 break-all font-mono">
                                    {process.env.NEXT_PUBLIC_BASE_URL || window.location.origin}/jobs/{vacancy.id}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {!loading && !error && (
                    <div className="flex gap-3 p-6 border-t bg-gray-50 rounded-b-xl">
                        <button
                            onClick={handleCopyLink}
                            className={`flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium transition-colors ${copied
                                    ? 'bg-green-50 border-green-300 text-green-700'
                                    : 'bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            {copied ? '✓ Copied!' : '📋 Copy Link'}
                        </button>
                        <button
                            onClick={handleDownload}
                            className="flex-1 px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors font-medium"
                        >
                            ⬇️ Download
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}