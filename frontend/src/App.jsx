import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import UploadPage from './UploadPage'; 
import WorkshopDashboard from './workshop_dashboard'; 

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<UploadPage />} />
        <Route path="/dashboard" element={<WorkshopDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;