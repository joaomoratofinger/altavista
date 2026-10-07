import { Navigate, Outlet, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import RegionPage from './pages/RegionPage'
import OwnerForm from './pages/OwnerForm'
import BuyerForm from './pages/BuyerForm'
import Thanks from './pages/Thanks'
import NotFound from './pages/NotFound'
import PainelLayout from './pages/painel/PainelLayout'
import Dashboard from './pages/painel/Dashboard'
import PropertyList from './pages/painel/PropertyList'
import PropertyReview from './pages/painel/PropertyReview'
import BuyerList from './pages/painel/BuyerList'
import BuyerReview from './pages/painel/BuyerReview'
import { RegionFormPage, RegionList } from './pages/painel/RegionAdmin'
import TermsAdmin from './pages/painel/TermsAdmin'
import LogAdmin from './pages/painel/LogAdmin'
import { useAuth } from './lib/auth'

/** Rotas só de administrador (regiões, termos, log). Corretor volta ao resumo. */
function RequireAdmin() {
  const { isAdmin } = useAuth()
  return isAdmin ? <Outlet /> : <Navigate to="/painel" replace />
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="regiao/:slug" element={<RegionPage />} />
        <Route path="proprietario" element={<OwnerForm />} />
        <Route path="comprador" element={<BuyerForm />} />
        <Route path="obrigado" element={<Thanks />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route path="painel" element={<PainelLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="imoveis" element={<PropertyList />} />
        <Route path="imoveis/:id" element={<PropertyReview />} />
        <Route path="compradores" element={<BuyerList />} />
        <Route path="compradores/:id" element={<BuyerReview />} />
        <Route element={<RequireAdmin />}>
          <Route path="regioes" element={<RegionList />} />
          <Route path="regioes/nova" element={<RegionFormPage />} />
          <Route path="regioes/:id" element={<RegionFormPage />} />
          <Route path="termos" element={<TermsAdmin />} />
          <Route path="log" element={<LogAdmin />} />
        </Route>
        <Route path="*" element={<Navigate to="/painel" replace />} />
      </Route>
    </Routes>
  )
}
