-- Imóveis públicos: finalidade (venda ou aluguel). Rode depois da 0004.
alter table listings
  add column purpose text not null default 'venda' check (purpose in ('venda', 'aluguel'));
