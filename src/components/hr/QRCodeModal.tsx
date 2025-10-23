'use client';

import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface Vacancy {
    id: string;
    title: string;
}

interface QRCodeModalProps {
    vacancy: Vacancy;
    onClose: () => void;
}

export default function QRCodeModal({ vacancy, onClose }: QRCodeModalProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const publicUrl = `${window.location.origin}/careers?vacancy=${vacancy.id}`;

    useEffect(() => {
        if (canvasRef.current) {
            QRCode.toCanvas(canvasRef.current, publicUrl, {
                width: 300,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });
        }
    }, [publicUrl]);

    const downloadQR = () => {
        if (canvasRef.current) {
            const url = canvasRef.current.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `qr-${vacancy.id}.png`;
            link.href = url;
            link.click();
        }
    };

    const copyLink = () => {
        navigator.clipboard.writeText(publicUrl);
        alert('Link copied to clipboard!');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">
                            QR Code
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="text-center">
                        <p className="text-sm text-gray-600 mb-4">{vacancy.title}</p>
                        
                        <div className="flex justify-center mb-4">
                            <canvas ref={canvasRef} className="border-2 border-gray-200 rounded-lg" />
                        </div>

                        <div className="bg-gray-50 rounded-lg p-3 mb-4">
                            <p className="text-xs text-gray-600 mb-1">Public Link:</p>
                            <p className="text-sm font-mono text-gray-800 break-all">{publicUrl}</p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={copyLink}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Copy Link
                            </button>
                            <button
                                onClick={downloadQR}
                                className="flex-1 px-4 py-2 bg-blue-900 text-white font-medium rounded-lg hover:bg-blue-800 transition-colors"
                            >
                                Download QR
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}