# Fila automática do Respawn Ofertas

Ativação autorizada em 05/10/2026: um post por dia com foto e link. Horário configurado: 19:17 em America/Sao_Paulo. Próxima execução esperada após implantação em 06/10: 07/10/2026. O GitHub pode atrasar ou perder uma execução; o PC pode permanecer desligado.

Fila inicial: mouse sem fio Uniwity, controle estilo Xbox 360 com opções com fio e sem fio, suporte para controles, memória DDR4 branca. Fotos exatas conferidas no portal Shopee em 05/10, exportadas para JPEG e protegidas por SHA-256. Os Offer Link do CSV original são preservados. São indicações de produtos: preço, estoque e cupom devem ser consultados no anúncio. Nenhuma condição é inventada ou copiada de outros canais.

Modo da fila: curated_photo, catalogo-fotos.json. Amazon permanece fora desta fila enquanto faltam dados autorizados para fotos e condições. O Redragon publicado manualmente já consta no histórico e não é reenviado. A API Shopee foi ativada em 06/10; a descoberta automática depende de Secrets e teste real conforme API-SHOPEE.md. `shopeeApi.enabled` permanece false até esse teste.

O bot publica exclusivamente no canal -1003910154291, após confirmar a própria identidade e permissão. Não lê conversas pessoais nem usa sessão de WhatsApp. Há reserva persistida antes de enviar, confirmação da foto e legenda e bloqueio após resposta ambígua. O limite é um post por dia, com intervalo mínimo de quatro horas. O catálogo expira após sete dias e precisa ser reconferido.

Quando a fila termina, não envia outros produtos nem repete os anteriores. Actions pode continuar executando a conferência diária, dentro da franquia gratuita já conferida. Para pausar os envios, definir cloudEnabled=false em config.json. Manter state/history.json.

Validação: 28 testes aprovados localmente e na nuvem em 06/10; bot e destino confirmados pela API oficial Telegram. Primeira foto enviada pelo bot na nuvem em 06/10 às 19:26: mouse Uniwity, https://t.me/RespawnOfertasYuri/6. Foto e legenda confirmadas pela API; histórico persistido no GitHub. Restam três itens na fila. Essa execução foi acionada manualmente; a primeira execução pelo horário agendado ainda não foi observada. Configurar o cron não confirma um envio futuro.

- [Canal](https://t.me/RespawnOfertasYuri)
- [GitHub Actions](https://github.com/yuri434/respawn-ofertas/actions/workflows/canal.yml)
- [Horários e limites do agendamento GitHub](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)
