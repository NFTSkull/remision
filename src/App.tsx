import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppLayout } from './modules/remision/components/AppLayout';
import {
  EditarRemisionPage,
  VerRemisionPage,
} from './modules/remision/pages/EditarRemisionPage';
import { HistorialPage } from './modules/remision/pages/HistorialPage';
import { NuevaRemisionPage } from './modules/remision/pages/NuevaRemisionPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<NuevaRemisionPage />} />
          <Route path="historial" element={<HistorialPage />} />
          <Route path="editar/:id" element={<EditarRemisionPage />} />
          <Route path="ver/:id" element={<VerRemisionPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
