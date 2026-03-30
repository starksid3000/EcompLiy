/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');
    const userId = params.get('userId');
    const firstName = params.get('firstName');

    if (accessToken && refreshToken) {
      // Create a simplified user object for the store
      const user = {
        id: userId,
        firstName: firstName,
      };

      login(accessToken, user, refreshToken);
      navigate('/');
    } else {
      setError('Authentication failed. No tokens found.');
      setTimeout(() => navigate('/login'), 3000);
    }
  }, [location, navigate, login]);

  return (
    <div className="flex justify-content-center align-items-center min-h-screen">
      <div className="text-center">
        {error ? (
          <p className="text-red-500 font-bold">{error}</p>
        ) : (
          <div>
            <i className="pi pi-spin pi-spinner text-4xl text-primary mb-3"></i>
            <h2 className="text-xl">Authenticating securely...</h2>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;