# API oficial Shopee

Acesso ativado no portal em 06/10/2026. Nenhuma chave foi copiada para arquivos ou para o chat.

O módulo `shopee.mjs` consulta somente o endpoint oficial da API de Afiliados. A assinatura segue SHA256(AppID + timestamp + corpo JSON exato + Secret). Erros de rede e da API não exibem credenciais ou mensagens externas.

No GitHub, em Settings → Secrets and variables → Actions, cadastre pessoalmente:

- `SHOPEE_APP_ID`: o AppID do portal.
- `SHOPEE_API_SECRET`: o campo Senha do portal.

Não use sua senha de login da Shopee. Não coloque essas informações em arquivos do repositório.

O modo `api_check` faz até duas buscas por produtos de PC/jogos e mostra apenas os produtos completos, sem publicar. É necessário executar esse modo e conferir o resultado real antes de habilitar `shopeeApi.enabled` no `config.json`. Até lá, funciona somente a fila finita de fotos e links conferidos, aprovada anteriormente.

Quando habilitada, a API será consultada antes de cada publicação. As buscas alternam entre processadores Ryzen/Intel, placas de vídeo, DDR4/DDR5, mouse, teclado, mousepad e jogos de PS5. Rejeita resultados sem foto oficial, link de afiliado, anúncio correspondente, preço válido, período de oferta vigente ou nome pertinente. Não repete IDs nem links publicados. Publica no máximo uma vez por dia. Falhas ou respostas incompletas impedem a publicação.

O preço mínimo é identificado como mínimo e pode variar conforme a opção do anúncio. O preço final, frete e disponibilidade devem ser conferidos pelo comprador. A consulta oficial não fornece campo de cupom: cupons não são inventados nem copiados de outros canais.

Fontes oficiais consultadas:

- https://affiliate.shopee.com.br/open_api/document?type=authentication
- https://affiliate.shopee.com.br/open_api/document?type=request_response
- https://affiliate.shopee.com.br/open_api/list?type=product_offer
