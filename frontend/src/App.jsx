import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import SellersList from './pages/sellers/SellersList' 

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/sellers" element={<SellersList />} />
      </Routes>
    </BrowserRouter>
  )
}
