# Respawn Ofertas

Atualizado em 06/10/2026. O bot consulta a API oficial Shopee e publica no Telegram uma vez por dia, às 19:17 em America/Sao_Paulo, pelo GitHub Actions. O PC pode ficar desligado. Próxima execução esperada: 07/10/2026; agendamentos do GitHub podem atrasar e a primeira execução pelo cron ainda não foi observada.

## Conteúdo automático

Buscas alternadas em 30 categorias: processadores Ryzen/Intel, placas de vídeo, DDR4/DDR5, SSDs, placas-mãe, fontes, gabinetes, coolers, mouse, teclado, mousepad, headset, microfone, controles, monitores, cadeiras, PCs, notebooks, celulares, consoles e jogos de PS5/Xbox/Switch.

Cada publicação usa o nome, foto e preço retornados pela API, com o link de afiliado original para PC/celular e identificação publicitária. Preço mínimo é identificado como mínimo quando há variantes. Frete, preço final e disponibilidade podem mudar. Não fabrica link separado para aplicativo, descontos, cupons, benchmarks ou compatibilidade. A consulta usada não fornece campo de cupom.

Exige nota mínima 4,5, dez vendas e loja oficial/preferida segundo shopType 1/2/4 da Shopee. Rejeita itens usados, recondicionados, quebrados e resultados incompatíveis com a categoria. Avaliações e vendas não comprovam desempenho, autenticidade ou bom custo-benefício: nenhum PC ou notebook é anunciado como capaz de rodar determinado jogo sem verificação específica.

## Validação e histórico

28 testes passaram na nuvem. A consulta real autenticada retornou três produtos completos com fotos, preços e links, sem publicar: [execução #18](https://github.com/yuri434/respawn-ofertas/actions/runs/37541513543).

A primeira foto publicada pelo bot na nuvem foi o [mouse Uniwity](https://t.me/RespawnOfertasYuri/6), em 06/10 às 19:26. Veio da fila anterior, sem preço. A primeira publicação com preço da API aguarda a execução diária seguinte. Três publicações reais constam no histórico; não são reenviadas.

O bot fixa sua identidade e o canal -1003910154291, verifica autorização, persiste uma reserva antes de enviar e confirma foto/legenda após a resposta. Resposta ambígua bloqueia novos envios até conferência. Limite de uma publicação por dia e intervalo mínimo de quatro horas. A fila anterior de fotos fica inativa enquanto a API estiver habilitada. Amazon continua pendente; esta descoberta automática usa Shopee.

## Operação

- GitHub Secrets: TELEGRAM_BOT_TOKEN, SHOPEE_APP_ID e SHOPEE_API_SECRET, cadastrados pessoalmente pelo usuário; nenhum valor foi lido ou incluído no repositório.
- Em Actions, `api_check` consulta ofertas sem publicar; `verify` confere bot e canal; `check` verifica a configuração e o limite diário.
- Para pausar: cloudEnabled=false em config.json. Preserve state/history.json.
- Não usa sessões de WhatsApp nem lê conversas pessoais.

[Canal](https://t.me/RespawnOfertasYuri) · [Execuções](https://github.com/yuri434/respawn-ofertas/actions/workflows/canal.yml) · [API Shopee](API-SHOPEE.md) · [Rotina](ROTINA-AUTOMATICA.md)
