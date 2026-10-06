import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Portfolio from './pages/Portfolio'
import OffMarket from './pages/OffMarket'
import PropertyDetail from './pages/PropertyDetail'
import PainelLayout from './pages/painel/PainelLayout'
import PropertyList from './pages/painel/PropertyList'
import PropertyForm from './pages/painel/PropertyForm'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="portfolio" element={<Portfolio />} />
        <Route path="off-market" element={<OffMarket />} />
        <Route path="imovel/:slug" element={<PropertyDetail />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route path="painel" element={<PainelLayout />}>
        <Route index element={<PropertyList />} />
        <Route path="novo" element={<PropertyForm />} />
        <Route path=":id" element={<PropertyForm />} />
      </Route>
    </Routes>
  )
}
