import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import SellersList from './pages/sellers/SellersList';
import NewSeller from './pages/sellers/NewSeller';
import SellerDetail from './pages/sellers/SellerDetail';

function App() {
  return (
    <Router>
      <NavBar />
      <Routes>
        <Route path="/sellers" element={<SellersList />} />
        <Route path="/sellers/new" element={<NewSeller />} />
        <Route path="/sellers/:id" element={<SellerDetail />} />
      </Routes>
    </Router>
  );
}

export default App;
