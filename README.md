# Respawn Ofertas

Atualizado em 08/10/2026. O cron-job.org aciona o workflow GitHub Actions a cada cinco minutos com mode publish. A execução continua no GitHub, com o PC desligado, consultando a API oficial Shopee e publicando até um produto completo por janela. O cron interno do GitHub foi substituído após intervalos reais de 5 a 7 horas. O aceite do acionamento não garante publicação: a fila de runners e a disponibilidade de produtos elegíveis podem afetar os horários.

## Conteúdo automático

As buscas mudam de categoria a cada cinco minutos, com até quatro consultas por execução e no máximo um envio. Há até 288 janelas por dia. Buscas em 30 categorias: processadores Ryzen/Intel, placas de vídeo, DDR4/DDR5, SSDs, placas-mãe, fontes, gabinetes, coolers, mouse, teclado, mousepad, headset, microfone, controles, monitores, cadeiras, PCs, notebooks, celulares, consoles e jogos de PS5/Xbox/Switch.

Cada publicação usa o nome, foto e preço retornados pela API, com o link de afiliado original para PC/celular e identificação publicitária. Preço mínimo é identificado como mínimo quando há variantes. Frete, preço final e disponibilidade podem mudar. Não fabrica link separado para aplicativo, descontos, cupons, benchmarks ou compatibilidade. A consulta usada não fornece campo de cupom.

Exige nota mínima 4,5, dez vendas e loja oficial/preferida segundo shopType 1/2/4 da Shopee. Rejeita itens usados, recondicionados, quebrados e resultados incompatíveis com a categoria. Avaliações e vendas não comprovam desempenho, autenticidade ou bom custo-benefício: nenhum PC ou notebook é anunciado como capaz de rodar determinado jogo sem verificação específica.

## Validação e histórico

35 testes passaram localmente e na nuvem, incluindo falha de salvamento depois de uma resposta válida do Telegram. A consulta real autenticada na execução #20 retornou produtos com fotos, preços e links: [verificação](https://github.com/yuri434/respawn-ofertas/actions/runs/37687104378).

O [Ryzen 7 5700X](https://t.me/RespawnOfertasYuri/7) teve a confirmação reconciliada após uma falha posterior de git push, sem reenviar o produto. A persistência tenta o mesmo commit até três vezes e mantém o recibo confirmado. O teste pelo cron-job.org recebeu HTTP 200 e iniciou a [execução #28](https://github.com/yuri434/respawn-ofertas/actions/runs/37857034864), que publicou o [post /14](https://t.me/RespawnOfertasYuri/14) com foto, preço mínimo e link de afiliado. O histórico de publicações é mantido em state/history.json. O estado detalhado e as execuções automáticas observadas constam em preparacao-status.json.

O bot fixa sua identidade e o canal -1003910154291, verifica autorização, persiste uma reserva antes de enviar e confirma foto/legenda após a resposta. Resposta ambígua bloqueia novos envios até conferência. Limite de uma publicação em cada janela de cinco minutos, até 288 por dia. A proteção mínima entre envios é de quatro minutos para absorver pequeno atraso do agendador; não permite dois envios na mesma janela. A fila anterior de fotos fica inativa enquanto a API estiver habilitada. Amazon continua pendente; esta descoberta automática usa Shopee.

## Operação

- GitHub Secrets: TELEGRAM_BOT_TOKEN, SHOPEE_APP_ID e SHOPEE_API_SECRET, cadastrados pessoalmente pelo usuário; nenhum valor foi lido ou incluído no repositório.
- Cron-job.org: job 8608337, intervalo de cinco minutos em America/Sao_Paulo. POST para a API oficial GitHub com corpo {"ref":"main","inputs":{"mode":"publish"}}. O usuário mantém o token de acionamento diretamente no cabeçalho Authorization do serviço, com acesso somente a respawn-ofertas, Actions read/write e Metadata read. Validade da credencial verificada na resposta GitHub: 06/01/2027, 23:00:37 UTC; renovar antes do vencimento.
- Em Actions, `api_check` consulta ofertas sem publicar; `verify` confere bot e canal; `check` verifica a configuração e o limite diário.
- Para pausar: cloudEnabled=false em config.json. Preserve state/history.json.
- Não usa sessões de WhatsApp nem lê conversas pessoais.

[Canal](https://t.me/RespawnOfertasYuri) · [Execuções](https://github.com/yuri434/respawn-ofertas/actions/workflows/canal.yml) · [API Shopee](API-SHOPEE.md) · [Rotina](ROTINA-AUTOMATICA.md)

## Código público

A publicação do repositório permite leitura do código e dos registros de publicações do próprio canal. As credenciais Shopee e Telegram permanecem nos GitHub Actions Secrets. O token limitado do agendador fica no cron-job.org. Nenhuma credencial entra em arquivos ou logs do repositório. O workflow não recebe código de pull requests e executa apenas main por workflow_dispatch. Na lista do GitHub, os acionamentos do agendador externo aparecem como Manually triggered, pois usam essa API. Não habilitar credenciais para código de terceiros.
