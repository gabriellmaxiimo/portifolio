import React from 'react';
import cruzeiroLogo from '../../cruzeiro-ec-logo.svg';

export default function CruzeiroLogo({ className }) {
  return (
    <img
      src={cruzeiroLogo}
      alt="Cruzeiro Esporte Clube"
      className={`object-contain ${className}`}
    />
  );
}