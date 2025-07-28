import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import './Header.css';

const Header = ({ setUser }) => {
  const responseMessage = (response) => {
    console.log(response);
    setUser(response);
  };
  const errorMessage = (error) => {
    console.log(error);
  };

  return (
    <header className="app-header">
      <h1>Do It</h1>
      <GoogleLogin onSuccess={responseMessage} onError={errorMessage} />
    </header>
  );
};

export default Header;