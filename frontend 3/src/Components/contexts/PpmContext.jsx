import React, { createContext, useState } from 'react';

export const PpmContext = createContext();

export const PpmProvider = ({ children }) => {
  const [ppm, setPpm] = useState(null);

  return (
    <PpmContext.Provider value={{ ppm, setPpm }}>
      {children}
    </PpmContext.Provider>
  );
};
