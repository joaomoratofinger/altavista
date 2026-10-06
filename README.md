# Elizeu Almeida — site + área restrita

Site institucional da imobiliária de luxo Elizeu Almeida e o painel (`/painel`)
para cadastro de imóveis.

## Stack

- Vite + React 19 + TypeScript
- Tailwind CSS v4
- React Router 7
- Firebase: Hosting, Auth (e-mail + senha), Firestore e Storage

## Rodar

```bash
npm install
npm run dev
```

Sem o `.env` preenchido o site roda com dados de exemplo e `/painel` mostra um
aviso de configuração.

## Configurar o Firebase (uma vez)

1. No [Console do Firebase](https://console.firebase.google.com), crie um projeto
   e um **app da Web**; copie a config para `.env` (modelo em `.env.example`).
2. Ative **Authentication → Método de login → E-mail/senha**.
3. Crie o banco em **Firestore Database** e ative o **Storage**.
4. Crie o usuário do painel em **Authentication → Usuários → Adicionar usuário**
   e copie o **UID** dele.
5. No Firestore, crie a coleção **`admins`** com um documento cujo **ID é o UID**
   do passo 4 (pode ter um campo qualquer, ex.: `ativo: true`). Só quem tem esse
   documento acessa o painel e os dados privados — mesmo que alguém consiga criar
   conta, as regras bloqueiam.
6. Publique as regras e o site:

   ```bash
   npx firebase login
   npx firebase use --add
   npx firebase deploy --only firestore:rules,storage
   npm run deploy
   ```

## Estrutura

```
src/
  config.ts                contato, WhatsApp, textos globais do site
  types/property.ts        modelo do imóvel — separa campos PÚBLICOS de PRIVADOS
  data/properties.ts       leitura PÚBLICA (site): Firestore, ou mock sem .env
  data/adminProperties.ts  leitura/escrita do PAINEL (rascunhos, dados privados, fotos)
  lib/firebase.ts          inicialização (lê as VITE_FIREBASE_* do .env)
  lib/auth.tsx             AuthProvider: login, logout, checagem de admin
  components/              Header, Footer, PropertyCard, Layout, etc.
  pages/                   Home, Portfolio, OffMarket, PropertyDetail
  pages/painel/            PainelLayout (guarda), Login, PropertyList, PropertyForm
firestore.rules            regras do Firestore
storage.rules              regras do Storage
```

## Dados públicos x privados

| Dado | Onde fica | Quem lê |
|---|---|---|
| Campos públicos | `properties/{id}` | visitantes (só se `published == true`); admin vê tudo |
| Dados do proprietário | `properties/{id}/private/owner` | apenas admin logado |
| Fotos | Storage `properties/{id}/…` | públicas; só admin envia/apaga |
| Admins | `admins/{uid}` | criado só pelo Console |

O site nunca lê a subcoleção `private`; as regras do Firestore também a
bloqueiam para qualquer um que não seja admin.

## Painel

- `/painel` — lista de imóveis (publicados e rascunhos), editar e excluir.
- `/painel/novo` e `/painel/:id` — formulário com dados do site, fotos (envio,
  redução automática, ordem e capa), publicação e dados privados do proprietário.

## Ajustes pendentes de conteúdo real

- `src/config.ts`: telefone do WhatsApp, e-mail, Instagram.
- Cadastrar os imóveis reais e fotos definitivas pelo painel (os dados de
  exemplo em `src/data/properties.ts` só aparecem sem Firebase configurado).
