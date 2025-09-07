import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NavBar from './components/layout/NavBar';
import routes from './AppRoutes';

// Layout centralisé inline
function Layout({ children, fluid = false }) {
  return (
    <>
      <NavBar />
      <main className={fluid ? "container-fluid mt-4" : "container mt-4"}>
        {children}
      </main>
    </>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        {routes.map(({ path, element }) => (
          <Route
            key={path}
            path={path}
            element={<Layout>{element}</Layout>}
          />
        ))}
      </Routes>
    </Router>
  );
}

export default App;
