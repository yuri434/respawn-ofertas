# API oficial Shopee

Acesso ativado no portal em 06/10/2026. Nenhuma chave foi copiada para arquivos ou para o chat.

O módulo `shopee.mjs` consulta somente o endpoint oficial da API de Afiliados. A assinatura segue SHA256(AppID + timestamp + corpo JSON exato + Secret). Erros de rede e da API não exibem credenciais ou mensagens externas.

No GitHub, em Settings → Secrets and variables → Actions, cadastre pessoalmente:

- `SHOPEE_APP_ID`: o AppID do portal.
- `SHOPEE_API_SECRET`: o campo Senha do portal.

Não use sua senha de login da Shopee. Não coloque essas informações em arquivos do repositório.

O modo `api_check` faz até quatro buscas de tecnologia, ordenadas por volume de vendas, e mostra uma amostra pública dos dados retornados e os produtos completos, sem publicar. O teste real passou na execução #18 (https://github.com/yuri434/respawn-ofertas/actions/runs/37541513543), com três produtos completos. `shopeeApi.enabled` foi habilitado após essa conferência. As duas credenciais já foram cadastradas pelo usuário no GitHub em 06/10; nenhum valor foi lido pelo assistente.

A API é consultada antes de cada publicação. As buscas alternam entre processadores Ryzen/Intel, placas de vídeo, DDR4/DDR5, SSDs, placas-mãe, fontes, gabinetes, coolers, periféricos, headsets, microfones, monitores, cadeiras, PCs, notebooks, celulares, consoles e jogos de PS5/Xbox/Switch. Rejeita resultados sem foto oficial, link de afiliado, anúncio correspondente, preço válido, período de oferta vigente ou nome pertinente. Exige nota de pelo menos 4,5, pelo menos dez vendas e loja indicada pela API como oficial ou preferida (shopType 1/2/4). Esses sinais não são garantia de qualidade, autenticidade ou desempenho; o bot não inventa benchmarks ou compatibilidade. Itens usados, recondicionados, quebrados e acessórios incompatíveis com a categoria são omitidos.

Não repete IDs nem links publicados. Publica no máximo uma vez por dia. Falhas ou respostas incompletas impedem a publicação. O link oficial da API é preservado integralmente e aparece como “Abrir oferta — PC/celular”; não fabrica um endereço diferente para o app nem promete que o sistema do comprador abrirá o aplicativo.

O preço mínimo é identificado como mínimo e pode variar conforme a opção do anúncio. O preço final, frete e disponibilidade devem ser conferidos pelo comprador. A consulta oficial não fornece campo de cupom: cupons não são inventados nem copiados de outros canais.

Fontes oficiais consultadas:

- https://affiliate.shopee.com.br/open_api/document?type=authentication
- https://affiliate.shopee.com.br/open_api/document?type=request_response
- https://affiliate.shopee.com.br/open_api/list?type=product_offer
