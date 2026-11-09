# Altavista Residences — plataforma Acervo Off Market

Site institucional + cadastros de proprietários e compradores + painel interno
da equipe. São dois conjuntos de imóveis, separados de propósito:

- **Acervo off market** (tabela `properties`): cadastrado pelos proprietários,
  aprovado pela equipe e **nunca público**. Compradores aprovados veem uma
  versão resumida (sem condomínio, proprietário ou fotos) em `/acervo`.
- **Vitrine pública** (tabela `listings`): anúncios de venda ou aluguel
  cadastrados pela equipe em Painel → Anúncios e exibidos em `/imoveis`. Os
  dados do dono ficam em `listing_private`, legível só pela equipe.

> O site anterior (Elizeu Almeida, portfólio público + Firebase) está guardado
> na tag git `site-elizeu-v1`.

## Stack

- Vite + React 19 + TypeScript, Tailwind CSS v4, React Router 7
- Supabase: Postgres (RLS), Auth (e-mail + senha), Storage

## Rodar

```bash
npm install
cp .env.example .env   # preencha URL e anon key do Supabase
npm run dev
```

Sem `.env`, o site abre mas formulários e painel avisam que falta configurar.

## Configurar o Supabase (uma vez por ambiente)

Use um projeto para **homologação** e outro para **produção**.

1. Crie o projeto em supabase.com e copie *Project URL* e *anon key*
   (Project Settings → API) para o `.env`.
2. No **SQL Editor**, rode **em ordem** todos os arquivos de `supabase/migrations/`:
   - `0001_schema.sql` e `0002_security_and_functions.sql`: tabelas, permissões
     (RLS), funções, buckets e dados iniciais (4 regiões e termos provisórios);
   - `0003_buyer_access.sql`: cadastro manual de compradores e login deles
     (`/entrar` → `/acervo`) enquanto o WhatsApp oficial não existe;
   - `0004_listings.sql`: vitrine pública de imóveis e bucket `listing-media`;
   - `0005_listing_purpose.sql`: finalidade do anúncio (venda ou aluguel).
3. Em **Authentication → Users**, crie o primeiro usuário da equipe e rode:
   ```sql
   insert into profiles (id, name, role) values ('<uuid do usuário>', 'Nome', 'admin');
   ```
   Perfis: `admin` (tudo) e `corretor` (vê e modera imóveis e compradores).
4. Em **Authentication → URL Configuration**, ponha a URL do site (para o link de
   redefinição de senha). Em **Authentication → Sign In / Providers**, desligue
   *Allow new users to sign up*: os logins são criados só pela equipe.
5. Ative os backups automáticos (Database → Backups; backup contínuo (PITR) exige plano pago).

## Estrutura

```
supabase/migrations/   esquema, regras de acesso e funções
src/config.ts          nome, contato e WhatsApp do site
src/data/site.ts       acesso PÚBLICO: regiões, anúncios, termos, cadastros, área do comprador
src/data/admin.ts      acesso do PAINEL (só funciona logado como equipe)
src/lib/auth.tsx       login e perfil (admin/corretor)
src/pages/             home, regiões, imóveis (vitrine), formulários, entrar/acervo
src/pages/painel/      resumo, acervo, anúncios, compradores, regiões, termos, log
```

O código do painel é carregado à parte (`lazy`): quem visita o site não o baixa.

## Como o sigilo funciona

| Dado | Quem lê |
|---|---|
| Regiões ativas, termos ativos, contagem pública, anúncios publicados e suas fotos | qualquer visitante |
| Acervo resumido compatível com o perfil (sem condomínio, dono ou fotos) | o próprio comprador aprovado, logado |
| Acervo, proprietários, compradores, conversas, dados internos dos anúncios | só equipe ativa (`profiles`) |
| Fotos do acervo (bucket privado `property-media`) | só equipe, por link temporário de 1 h |
| Log de acessos, regiões/termos (edição), exclusão (LGPD) | só administrador |

Visitantes **não** conseguem ler nem listar nada: os cadastros entram pelas
funções `submit_owner` e `submit_buyer`, que validam tudo no servidor (CPF
incluído) e respondem igual exista ou não o CPF. As fotos são enviadas para
`incoming/…`, pasta onde o visitante só consegue gravar.

## Status das etapas do briefing

| Etapa | Situação |
|---|---|
| 3. Banco e painel | **Código pronto, não testado em Supabase real** |
| 4. Site e abas por região | **Código pronto, não testado** |
| 5. Cadastros (proprietário e comprador) | **Código pronto, não testado** |
| 6. WhatsApp (API oficial) | Pendente — precisa de conta/provedor |
| 7. Agente de IA | Pendente — precisa do modelo e do WhatsApp |
| 8. Segurança | Parcial: bucket privado, link temporário, log, exclusão LGPD. Falta marca d'água, rotina de limpeza de uploads órfãos e CAPTCHA nos formulários |
| 9. Lançamento | Pendente |

## Pendências conhecidas

- Textos reais dos termos (editar em Painel → Termos) e das regiões.
- Número de WhatsApp e e-mail em `src/config.ts` são provisórios (todos os botões
  "Tenho interesse" e "WhatsApp" do site usam esse número).
- Identidade visual (logo, cores): `src/index.css` (tokens) e `src/components/Logo.tsx`.
- Contas de WhatsApp Business, provedor e modelo de IA ainda não definidos.
