import React, { useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const Register = () => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();

    const passwordsMatch = password === confirmPassword;

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');

        if (!passwordsMatch) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);

        try {
            await api.post('/auth/register', {
                firstName,
                lastName,
                email,
                password
            });

            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please verify your details.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="flex justify-content-center align-items-center min-h-screen"
            style={{
                background: 'linear-gradient(135deg, #dbd9f4ff, #ffffffff)'
            }}
        >
            <div
                className="surface-card p-4 shadow-6 border-round-2xl w-full fadein animation-duration-300"
                style={{ maxWidth: '460px' }}
            >
                <div className="text-center mb-5">
                    <i className="pi pi-user-plus text-primary text-5xl mb-3"></i>
                    <h2 className="text-900 font-bold mb-2">Create Account</h2>
                    <span className="text-600 text-sm">
                        Join us to shop amazing products
                    </span>
                </div>

                {error && (
                    <Message severity="error" text={error} className="mb-4 w-full" />
                )}

                <form onSubmit={handleRegister} className="flex flex-column gap-4">

                    {/* Name Row */}
                    <div className="grid">
                        <div className="col-12 md:col-6">
                            <span className="p-float-label">
                                <InputText
                                    id="firstName"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="w-full p-3"
                                    autoComplete="given-name"
                                    required
                                />
                                <label htmlFor="firstName">First Name</label>
                            </span>
                        </div>

                        <div className="col-12 md:col-6">
                            <span className="p-float-label">
                                <InputText
                                    id="lastName"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="w-full p-3"
                                    autoComplete="family-name"
                                    required
                                />
                                <label htmlFor="lastName">Last Name</label>
                            </span>
                        </div>
                    </div>

                    {/* Email */}
                    <span className="p-float-label">
                        <InputText
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3"
                            autoComplete="email"
                            required
                        />
                        <label htmlFor="email">Email</label>
                    </span>

                    {/* Password */}
                    <span className="p-float-label">
                        <Password
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            toggleMask
                            className="w-full"
                            inputClassName="w-full p-3"
                            autoComplete="new-password"
                            feedback={false}
                            required
                        />
                        <label htmlFor="password">Password</label>
                    </span>

                    {/* Confirm Password */}
                    <span className="p-float-label">
                        <Password
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            toggleMask
                            className={`w-full ${confirmPassword && !passwordsMatch ? 'p-invalid' : ''}`}
                            inputClassName="w-full p-3"
                            autoComplete="new-password"
                            feedback={false}
                            required
                        />
                        <label htmlFor="confirmPassword">Confirm Password</label>
                    </span>

                    {confirmPassword && !passwordsMatch && (
                        <small className="text-red-500">
                            Passwords do not match
                        </small>
                    )}

                    <Button
                        label={loading ? "Creating account..." : "Sign Up"}
                        icon={loading ? "pi pi-spin pi-spinner" : "pi pi-user-plus"}
                        className="w-full p-3 text-lg font-semibold border-round-xl"
                        type="submit"
                        loading={loading}
                        disabled={loading}
                    />
                </form>

                <div className="mt-5 text-center text-sm">
                    <span className="text-600">Already have an account? </span>
                    <a
                        href="/login"
                        className="font-semibold text-primary hover:underline"
                    >
                        Login
                    </a>
                </div>
            </div>
        </div>
    );
};

export default Register;