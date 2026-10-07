# Respawn Ofertas

Atualizado em 07/10/2026. Rotina ativada para consultar a API oficial Shopee a cada cinco minutos e publicar no Telegram até um produto completo por janela, pelo GitHub Actions, com o PC desligado. Execuções agendadas só rodam se o repositório estiver público. O GitHub pode atrasar ou omitir execuções; o intervalo não é garantia de pontualidade. Sem produto completo elegível, não publica.

## Conteúdo automático

As buscas mudam de categoria a cada cinco minutos, com até quatro consultas por execução e no máximo um envio. Há até 288 janelas por dia. Buscas em 30 categorias: processadores Ryzen/Intel, placas de vídeo, DDR4/DDR5, SSDs, placas-mãe, fontes, gabinetes, coolers, mouse, teclado, mousepad, headset, microfone, controles, monitores, cadeiras, PCs, notebooks, celulares, consoles e jogos de PS5/Xbox/Switch.

Cada publicação usa o nome, foto e preço retornados pela API, com o link de afiliado original para PC/celular e identificação publicitária. Preço mínimo é identificado como mínimo quando há variantes. Frete, preço final e disponibilidade podem mudar. Não fabrica link separado para aplicativo, descontos, cupons, benchmarks ou compatibilidade. A consulta usada não fornece campo de cupom.

Exige nota mínima 4,5, dez vendas e loja oficial/preferida segundo shopType 1/2/4 da Shopee. Rejeita itens usados, recondicionados, quebrados e resultados incompatíveis com a categoria. Avaliações e vendas não comprovam desempenho, autenticidade ou bom custo-benefício: nenhum PC ou notebook é anunciado como capaz de rodar determinado jogo sem verificação específica.

## Validação e histórico

35 testes passaram localmente e na nuvem, incluindo falha de salvamento depois de uma resposta válida do Telegram. A consulta real autenticada na execução #20 retornou produtos com fotos, preços e links: [verificação](https://github.com/yuri434/respawn-ofertas/actions/runs/37687104378).

O [Ryzen 7 5700X](https://t.me/RespawnOfertasYuri/7) foi publicado pela API em 07/10 às 18:14 com foto, R$ 1.429,00 e link original. A confirmação foi reconciliada após uma falha posterior de git push, sem reenviar o produto. A nova persistência tenta o mesmo commit até três vezes e mantém o recibo confirmado. A [execução #22](https://github.com/yuri434/respawn-ofertas/actions/runs/37688683392) publicou o [Samsung A17](https://t.me/RespawnOfertasYuri/8), com foto e R$ 1.239,90, e salvou o histórico automaticamente. Cinco publicações reais constam no histórico. O cron está habilitado; seu primeiro disparo está em observação. O estado detalhado está em preparacao-status.json.

O bot fixa sua identidade e o canal -1003910154291, verifica autorização, persiste uma reserva antes de enviar e confirma foto/legenda após a resposta. Resposta ambígua bloqueia novos envios até conferência. Limite de uma publicação em cada janela de cinco minutos, até 288 por dia. A proteção mínima entre envios é de quatro minutos para absorver pequeno atraso do agendador; não permite dois envios na mesma janela. A fila anterior de fotos fica inativa enquanto a API estiver habilitada. Amazon continua pendente; esta descoberta automática usa Shopee.

## Operação

- GitHub Secrets: TELEGRAM_BOT_TOKEN, SHOPEE_APP_ID e SHOPEE_API_SECRET, cadastrados pessoalmente pelo usuário; nenhum valor foi lido ou incluído no repositório.
- Em Actions, `api_check` consulta ofertas sem publicar; `verify` confere bot e canal; `check` verifica a configuração e o limite diário.
- Para pausar: cloudEnabled=false em config.json. Preserve state/history.json.
- Não usa sessões de WhatsApp nem lê conversas pessoais.

[Canal](https://t.me/RespawnOfertasYuri) · [Execuções](https://github.com/yuri434/respawn-ofertas/actions/workflows/canal.yml) · [API Shopee](API-SHOPEE.md) · [Rotina](ROTINA-AUTOMATICA.md)

## Código público

A publicação do repositório permite leitura do código e dos registros de publicações do próprio canal. As credenciais permanecem nos GitHub Actions Secrets e nunca entram em arquivos ou logs. O workflow não recebe código de pull requests e executa apenas a branch principal em cron ou acionamento manual. Não habilitar credenciais para código de terceiros.
