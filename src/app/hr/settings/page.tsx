"use client";

import React, { useState } from "react";
import { Lock, User, Shield, Eye, EyeOff, Check, X } from "lucide-react";

type TabId = "password" | "profile" | "security";

export default function Page() {
    const [activeTab, setActiveTab] = useState<TabId>("password");

    // password form state
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [strength, setStrength] = useState(0);
    const [success, setSuccess] = useState("");

    const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
        { id: "password", label: "Change Password", icon: Lock },
        { id: "profile", label: "Profile", icon: User },
        { id: "security", label: "Security", icon: Shield },
    ];

    const onPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordForm((p) => ({ ...p, [name]: value }));
        if (name === "newPassword") {
            let s = 0;
            if (value.length >= 8) s++;
            if (/[a-z]/.test(value) && /[A-Z]/.test(value)) s++;
            if (/[0-9]/.test(value)) s++;
            if (/[^a-zA-Z0-9]/.test(value)) s++;
            setStrength(s);
        }
    };

    const onSubmitPassword = (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmPassword) return;
        // TODO: call your API route here
        setSuccess("Password changed successfully!");
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setStrength(0);
        setTimeout(() => setSuccess(""), 2500);
    };

    const strengthColor = (n: number) =>
        n === 0 ? "bg-gray-300" : n === 1 ? "bg-red-500" : n === 2 ? "bg-orange-500" : n === 3 ? "bg-yellow-500" : "bg-green-600";

    return (
        <div className="flex-1 p-8 bg-gray-50">
            <div className="max-w-5xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                    <p className="text-gray-600">Manage your account settings and preferences</p>
                </div>

                {success && (
                    <div className="mb-4 bg-green-100 border border-green-400 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
                        <Check size={18} />
                        <span>{success}</span>
                    </div>
                )}

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    {/* Tabs */}
                    <div className="flex border-b overflow-x-auto">
                        {tabs.map((t) => {
                            const Icon = t.icon;
                            const isActive = activeTab === t.id;
                            return (
                                <button
                                    key={t.id}
                                    onClick={() => setActiveTab(t.id)}
                                    className={[
                                        "flex items-center gap-2 px-5 py-4 font-medium whitespace-nowrap",
                                        isActive
                                            ? "text-teal-700 border-b-2 border-teal-600 bg-teal-50"
                                            : "text-gray-600 hover:bg-gray-50",
                                    ].join(" ")}
                                >
                                    <Icon size={18} />
                                    {t.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Content */}
                    <div className="p-8">
                        {/* Change Password */}
                        {activeTab === "password" && (
                            <form onSubmit={onSubmitPassword} className="max-w-2xl">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">Change Password</h2>

                                <div className="space-y-6">
                                    {/* current */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                                        <div className="relative">
                                            <input
                                                name="currentPassword"
                                                type={showCurrent ? "text" : "password"}
                                                value={passwordForm.currentPassword}
                                                onChange={onPasswordChange}
                                                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowCurrent((s) => !s)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                                            >
                                                {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* new */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                                        <div className="relative">
                                            <input
                                                name="newPassword"
                                                type={showNew ? "text" : "password"}
                                                value={passwordForm.newPassword}
                                                onChange={onPasswordChange}
                                                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNew((s) => !s)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                                            >
                                                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>

                                        {passwordForm.newPassword && (
                                            <div className="mt-2">
                                                <div className="flex gap-1 mb-1">
                                                    {[1, 2, 3, 4].map((i) => (
                                                        <div
                                                            key={i}
                                                            className={[
                                                                "h-2 flex-1 rounded",
                                                                i <= strength ? strengthColor(strength) : "bg-gray-200",
                                                            ].join(" ")}
                                                        />
                                                    ))}
                                                </div>
                                                <p className="text-sm text-gray-600">
                                                    Password strength:{" "}
                                                    <span className="font-medium">
                                                        {["", "Weak", "Fair", "Good", "Strong"][strength]}
                                                    </span>
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* confirm */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                                        <div className="relative">
                                            <input
                                                name="confirmPassword"
                                                type={showConfirm ? "text" : "password"}
                                                value={passwordForm.confirmPassword}
                                                onChange={onPasswordChange}
                                                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirm((s) => !s)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                                            >
                                                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>

                                        {passwordForm.confirmPassword &&
                                            passwordForm.newPassword !== passwordForm.confirmPassword && (
                                                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                                    <X size={16} />
                                                    Passwords do not match
                                                </p>
                                            )}
                                    </div>

                                    {/* reqs box */}
                                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm">
                                        <div className="font-medium text-gray-800 mb-2">Password Requirements:</div>
                                        <ul className="space-y-1 text-gray-700">
                                            <li>○ At least 8 characters</li>
                                            <li>○ Both uppercase and lowercase letters</li>
                                            <li>○ At least one number</li>
                                            <li>○ At least one special character</li>
                                        </ul>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={
                                            !passwordForm.currentPassword ||
                                            passwordForm.newPassword !== passwordForm.confirmPassword ||
                                            strength < 2
                                        }
                                        className="inline-flex items-center justify-center rounded-lg bg-teal-700 px-5 py-3 font-medium text-white hover:bg-teal-800 disabled:bg-gray-300"
                                    >
                                        Update Password
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Profile */}
                        {activeTab === "profile" && (
                            <div className="max-w-2xl">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Information</h2>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                                            <input
                                                type="text"
                                                placeholder="Juan"
                                                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                                            <input
                                                type="text"
                                                placeholder="Dela Cruz"
                                                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                                        <input
                                            type="email"
                                            placeholder="hr.user@udm.edu.ph"
                                            className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                                        <input
                                            type="tel"
                                            placeholder="+63 912 345 6789"
                                            className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                                        <input
                                            type="text"
                                            placeholder="Human Resources"
                                            className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                        />
                                    </div>

                                    <button className="inline-flex items-center justify-center rounded-lg bg-teal-700 px-5 py-3 font-medium text-white hover:bg-teal-800">
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Security */}
                        {activeTab === "security" && (
                            <div className="max-w-3xl">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">Security Settings</h2>

                                <div className="space-y-4">
                                    <div className="rounded-lg border border-gray-200 p-6 flex items-start justify-between">
                                        <div>
                                            <div className="font-semibold text-gray-900 mb-1">Two-Factor Authentication</div>
                                            <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                                        </div>
                                        <button className="rounded-md bg-teal-700 text-white px-4 py-2 text-sm font-medium hover:bg-teal-800">
                                            Enable
                                        </button>
                                    </div>

                                    <div className="rounded-lg border border-gray-200 p-6 flex items-start justify-between">
                                        <div>
                                            <div className="font-semibold text-gray-900 mb-1">Active Sessions</div>
                                            <p className="text-sm text-gray-600 mb-3">Manage your active sessions across devices</p>
                                            <div className="space-y-1 text-sm">
                                                <div className="flex items-center gap-2 text-gray-700">
                                                    <span className="h-2 w-2 rounded-full bg-green-500" />
                                                    Current Session - Windows • Chrome • Quezon City
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-500">
                                                    <span className="h-2 w-2 rounded-full bg-gray-400" />
                                                    Last active 2 days ago - Mobile • Safari
                                                </div>
                                            </div>
                                        </div>
                                        <button className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">
                                            View All
                                        </button>
                                    </div>

                                    <div className="rounded-lg border border-gray-200 p-6 flex items-start justify-between">
                                        <div>
                                            <div className="font-semibold text-gray-900 mb-1">Login History</div>
                                            <p className="text-sm text-gray-600 mb-3">Review your recent login activity</p>
                                            <div className="text-sm text-gray-600 space-y-1">
                                                <div>Last login: Today at 9:15 AM</div>
                                                <div>Previous login: Yesterday at 2:30 PM</div>
                                            </div>
                                        </div>
                                        <button className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">
                                            View History
                                        </button>
                                    </div>

                                    <div className="rounded-lg border border-gray-200 p-6 flex items-start justify-between">
                                        <div>
                                            <div className="font-semibold text-gray-900 mb-1">Password Last Changed</div>
                                            <p className="text-sm text-gray-600">Your password was last changed 45 days ago</p>
                                        </div>
                                        <button
                                            onClick={() => setActiveTab("password")}
                                            className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
                                        >
                                            Change Password
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
