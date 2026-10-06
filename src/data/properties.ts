import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { PropertyPublic } from '../types/property'

/**
 * Leitura PÚBLICA dos imóveis (usada pelo site). Só toca em `properties/{id}`;
 * a subcoleção `private` (dados do proprietário) nunca é lida aqui e as regras
 * do Firestore a bloqueiam para visitantes.
 *
 * Dados de exemplo (MOCK) só entram quando o Firebase não está configurado.
 * Contêm SOMENTE campos públicos — nada de proprietário/contato.
 */
const MOCK: Array<Omit<PropertyPublic, 'published'>> = [
  {
    id: 'santa-helena',
    slug: 'fazenda-santa-helena',
    title: 'Fazenda Santa Helena',
    status: 'off-market',
    location: 'Porto Feliz — SP',
    region: 'Porto Feliz',
    price: 24_500_000,
    builtAreaM2: 1100,
    suites: 6,
    landAlqueires: 12,
    bedrooms: 6,
    parking: 8,
    featured: true,
    createdAt: '2026-07-02',
    description:
      'Sede colonial restaurada com pé-direito alto, varandas em arcos e vista aberta para o pomar. Estrutura completa de haras, casa de caseiro e lago próprio.',
    highlights: [
      'Sede de 1.100 m² com 6 suítes',
      '12 alqueires de terreno com pomar formado',
      'Haras com 8 baias e picadeiro',
      'Lago próprio e nascente cadastrada',
      '20 minutos do centro de Porto Feliz',
    ],
    images: [
      { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80', alt: 'Fachada da sede' },
      { url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=80', alt: 'Sala de estar' },
      { url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1600&q=80', alt: 'Área externa' },
    ],
  },
  {
    id: 'casa-do-vale',
    slug: 'casa-do-vale',
    title: 'Casa do Vale',
    status: 'exclusivo',
    location: 'Condomínio Fazenda Boa Vista',
    region: 'Porto Feliz',
    price: 12_900_000,
    builtAreaM2: 740,
    landAreaM2: 5000,
    suites: 5,
    bedrooms: 5,
    parking: 4,
    featured: true,
    createdAt: '2026-08-11',
    description:
      'Arquitetura contemporânea assinada, integração total com o jardim e piscina de borda infinita voltada para o campo de golfe.',
    highlights: [
      '740 m² de área construída em terreno de 5.000 m²',
      '5 suítes, todas com closet e varanda',
      'Piscina de borda infinita aquecida',
      'Adega climatizada e home theater',
      'Condomínio Fazenda Boa Vista — golfe e equitação',
    ],
    images: [
      { url: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1600&q=80', alt: 'Fachada de vidro' },
      { url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1600&q=80', alt: 'Piscina' },
      { url: 'https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1600&q=80', alt: 'Cozinha' },
    ],
  },
  {
    id: 'casa-do-bosque',
    slug: 'casa-do-bosque',
    title: 'Casa do Bosque',
    status: 'off-market',
    location: 'Área rural — Porto Feliz',
    region: 'Porto Feliz',
    price: null,
    builtAreaM2: 620,
    landAreaM2: 3000,
    suites: 4,
    bedrooms: 4,
    parking: 4,
    featured: true,
    createdAt: '2026-08-29',
    description:
      'Casa térrea de linhas retas cercada por mata nativa preservada. Projeto de baixo impacto, com captação de água da chuva e energia solar.',
    highlights: [
      '620 m² térreos em 3.000 m² de terreno',
      'Mata nativa preservada no entorno',
      'Energia solar e reuso de água',
      '4 suítes com ventilação cruzada',
      'Pomar e horta orgânica implantados',
    ],
    images: [
      { url: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1600&q=80', alt: 'Fachada entre árvores' },
      { url: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1600&q=80', alt: 'Estar integrado' },
      { url: 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=1600&q=80', alt: 'Quarto' },
    ],
  },
  {
    id: 'quinta-do-douro',
    slug: 'quinta-do-douro',
    title: 'Quinta do Douro',
    status: 'exclusivo',
    location: 'Vale do Douro — Portugal',
    region: 'Portugal',
    price: 18_600_000,
    builtAreaM2: 900,
    landAreaM2: 40000,
    suites: 7,
    bedrooms: 7,
    parking: 6,
    featured: false,
    createdAt: '2026-06-18',
    description:
      'Quinta vinícola em socalcos sobre o rio Douro, com adega em funcionamento, casa principal em pedra e casa de hóspedes independente.',
    highlights: [
      'Casa principal em pedra de 900 m²',
      '4 hectares em socalcos com vinha em produção',
      'Adega equipada e marca registrada',
      'Casa de hóspedes independente',
      'Vista integral para o rio Douro',
    ],
    images: [
      { url: 'https://images.unsplash.com/photo-1523217582562-09d0def993a6?auto=format&fit=crop&w=1600&q=80', alt: 'Vinhas em socalcos' },
      { url: 'https://images.unsplash.com/photo-1505692952047-1a78307da8f2?auto=format&fit=crop&w=1600&q=80', alt: 'Casa em pedra' },
    ],
  },
  {
    id: 'haras-boa-vista',
    slug: 'haras-boa-vista',
    title: 'Haras Boa Vista',
    status: 'disponivel',
    location: 'Boituva — SP',
    region: 'Boituva',
    price: 9_800_000,
    builtAreaM2: 480,
    suites: 4,
    bedrooms: 4,
    landAlqueires: 8,
    parking: 6,
    featured: false,
    createdAt: '2026-05-30',
    description:
      'Haras em plena operação, com sede confortável, estrutura completa para criação e treinamento e acesso asfaltado até a porteira.',
    highlights: [
      'Sede de 480 m² com 4 suítes',
      '8 alqueires com piquetes formados',
      '24 baias, redondel e pista de trote',
      'Acesso asfaltado até a porteira',
    ],
    images: [
      { url: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=1600&q=80', alt: 'Cavalos no piquete' },
      { url: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1600&q=80', alt: 'Sede do haras' },
    ],
  },
]

const clone = <T,>(v: T): T =>
  typeof structuredClone === 'function' ? structuredClone(v) : JSON.parse(JSON.stringify(v))

const newestFirst = (a: PropertyPublic, b: PropertyPublic) =>
  b.createdAt.localeCompare(a.createdAt)

/**
 * Todos os imóveis publicados, mais recentes primeiro.
 * Firestore quando configurado; senão, os dados de exemplo.
 * (Ordenação no cliente: evita exigir índice composto no Firestore.)
 */
export async function listProperties(): Promise<PropertyPublic[]> {
  if (!db) {
    return clone(MOCK.map((p) => ({ ...p, published: true })).sort(newestFirst))
  }
  const snap = await getDocs(
    query(collection(db, 'properties'), where('published', '==', true)),
  )
  return snap.docs
    .map((d) => ({ ...(d.data() as Omit<PropertyPublic, 'id'>), id: d.id }))
    .sort(newestFirst)
}

/** Imóveis marcados para a "Seleção atual" da home. */
export async function listFeatured(): Promise<PropertyPublic[]> {
  return (await listProperties()).filter((p) => p.featured)
}

/** Um imóvel pelo slug da URL. */
export async function getPropertyBySlug(
  slug: string,
): Promise<PropertyPublic | null> {
  return (await listProperties()).find((p) => p.slug === slug) ?? null
}
