# Altavista Residences — plataforma Acervo Off Market

Site institucional + cadastros de proprietários e compradores + painel interno
da equipe. **Nada do acervo é público**: o site mostra a marca e as regiões;
imóveis só são vistos pela equipe (e, nas próximas etapas, entregues a
compradores aprovados pelo WhatsApp).

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
2. No **SQL Editor**, rode em ordem `supabase/migrations/0001_schema.sql` e
   `0002_security_and_functions.sql`. Eles criam tabelas, permissões (RLS),
   funções, buckets e os dados iniciais (4 regiões e termos provisórios).
3. Em **Authentication → Users**, crie o primeiro usuário da equipe e rode:
   ```sql
   insert into profiles (id, name, role) values ('<uuid do usuário>', 'Nome', 'admin');
   ```
   Perfis: `admin` (tudo) e `corretor` (vê e modera imóveis e compradores).
4. Em **Authentication → URL Configuration**, ponha a URL do site (para o link de
   redefinição de senha).
5. Ative os backups automáticos (Database → Backups; backup contínuo (PITR) exige plano pago).

## Estrutura

```
supabase/migrations/   esquema, regras de acesso e funções
src/config.ts          nome, contato e WhatsApp do site
src/data/site.ts       acesso PÚBLICO: regiões, termos, cadastros
src/data/admin.ts      acesso do PAINEL (só funciona logado como equipe)
src/lib/auth.tsx       login e perfil (admin/corretor)
src/pages/             home, aba de região, formulários, obrigado
src/pages/painel/      resumo, imóveis, compradores, regiões, termos, log
```

## Como o sigilo funciona

| Dado | Quem lê |
|---|---|
| Regiões ativas, termos ativos, contagem pública | qualquer visitante |
| Imóveis, proprietários, compradores, conversas | só equipe ativa (`profiles`) |
| Fotos (bucket privado `property-media`) | só equipe, por link temporário de 1 h |
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
- Número de WhatsApp e e-mail em `src/config.ts` são provisórios.
- Identidade visual (logo, cores): `src/index.css` (tokens) e `src/components/Logo.tsx`.
- Contas de WhatsApp Business, provedor e modelo de IA ainda não definidos.
