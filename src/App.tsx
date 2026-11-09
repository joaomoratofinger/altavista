import { lazy, Suspense } from 'react'
import { Navigate, Outlet, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import RegionPage from './pages/RegionPage'
import OwnerForm from './pages/OwnerForm'
import BuyerForm from './pages/BuyerForm'
import Thanks from './pages/Thanks'
import NotFound from './pages/NotFound'
import Imoveis from './pages/Imoveis'
import ImovelDetail from './pages/ImovelDetail'
import Entrar from './pages/Entrar'
import Acervo from './pages/Acervo'
import { AuthProvider, useAuth } from './lib/auth'
import { isConfigured } from './lib/supabase'

// Painel em arquivos separados: visitante do site não baixa esse código.
const PainelLayout = lazy(() => import('./pages/painel/PainelLayout'))
const Dashboard = lazy(() => import('./pages/painel/Dashboard'))
const PropertyList = lazy(() => import('./pages/painel/PropertyList'))
const PropertyReview = lazy(() => import('./pages/painel/PropertyReview'))
const PropertyEdit = lazy(() => import('./pages/painel/PropertyEdit'))
const BuyerList = lazy(() => import('./pages/painel/BuyerList'))
const BuyerReview = lazy(() => import('./pages/painel/BuyerReview'))
const BuyerCreate = lazy(() => import('./pages/painel/BuyerCreate'))
const ListingList = lazy(() => import('./pages/painel/ListingAdmin').then((m) => ({ default: m.ListingList })))
const ListingFormPage = lazy(() => import('./pages/painel/ListingAdmin').then((m) => ({ default: m.ListingFormPage })))
const RegionList = lazy(() => import('./pages/painel/RegionAdmin').then((m) => ({ default: m.RegionList })))
const RegionFormPage = lazy(() => import('./pages/painel/RegionAdmin').then((m) => ({ default: m.RegionFormPage })))
const TermsAdmin = lazy(() => import('./pages/painel/TermsAdmin'))
const LogAdmin = lazy(() => import('./pages/painel/LogAdmin'))

function PainelShell() {
  return (
    <Suspense fallback={<p className="p-8 text-sm text-mute">Carregando…</p>}>
      <PainelLayout />
    </Suspense>
  )
}

/** Rotas só de administrador (regiões, termos, log). Corretor volta ao resumo. */
function RequireAdmin() {
  const { isAdmin } = useAuth()
  return isAdmin ? <Outlet /> : <Navigate to="/painel" replace />
}

/** Rotas do comprador logado: só aqui a sessão do Supabase é carregada no site público. */
function ClientArea() {
  if (!isConfigured) return <Outlet />
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  )
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="regiao/:slug" element={<RegionPage />} />
        <Route path="imoveis" element={<Imoveis />} />
        <Route path="imovel/:slug" element={<ImovelDetail />} />
        <Route path="proprietario" element={<OwnerForm />} />
        <Route path="comprador" element={<BuyerForm />} />
        <Route path="obrigado" element={<Thanks />} />
        <Route element={<ClientArea />}>
          <Route path="entrar" element={<Entrar />} />
          <Route path="acervo" element={<Acervo />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route path="painel" element={<PainelShell />}>
        <Route index element={<Dashboard />} />
        <Route path="imoveis" element={<PropertyList />} />
        <Route path="imoveis/:id" element={<PropertyReview />} />
        <Route path="imoveis/:id/editar" element={<PropertyEdit />} />
        <Route path="anuncios" element={<ListingList />} />
        <Route path="anuncios/novo" element={<ListingFormPage />} />
        <Route path="anuncios/:id" element={<ListingFormPage />} />
        <Route path="compradores" element={<BuyerList />} />
        <Route path="compradores/novo" element={<BuyerCreate />} />
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
