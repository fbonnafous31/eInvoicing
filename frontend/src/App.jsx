import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import SellersList from './pages/sellers/SellersList' 
import NewSeller from './pages/sellers/NewSeller';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/sellers" element={<SellersList />} />
        <Route path="/sellers/new" element={<NewSeller />} />
      </Routes>
    </BrowserRouter>
  )
}
