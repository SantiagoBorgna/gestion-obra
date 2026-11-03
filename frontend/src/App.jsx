import { Routes, Route } from 'react-router-dom';
import Estado from './pages/Estado.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="*" element={<Estado />} />
    </Routes>
  );
}
