import React from 'react';

export default function CruzeiroLogo({ className }) {
  return (
    <img
      src="\cruzeiro-ec-logo.svg"
      alt="Cruzeiro Esporte Clube"
      className={`object-contain ${className}`}
    />
  );
}