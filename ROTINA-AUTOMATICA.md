# Rotina automática do Respawn Ofertas

Desde 06/10/2026, a descoberta oficial Shopee substitui a fila fixa quando shopeeApi.enabled=true. Um post por dia, às 19:17 (America/Sao_Paulo), pelo GitHub Actions, com o PC desligado. Próximo horário esperado: 07/10/2026. A primeira execução pelo cron ainda não foi observada; o GitHub pode atrasar uma execução.

Busca produtos de tecnologia/gamer e celulares em 30 categorias alternadas. Confere anúncio, foto oficial, preço, período vigente e link de afiliado, preservando o link integral. Exige avaliações, vendas e tipo de loja conforme API-SHOPEE.md. Não inventa preços, descontos, cupons, desempenho ou compatibilidade. A consulta usada não fornece cupons. Se não houver produto completo elegível, não publica.

Publica somente no canal -1003910154291, após confirmar o próprio bot e sua permissão. Reserva persistida no GitHub antes do envio e confirmação de foto/legenda depois. Resposta ambígua bloqueia repetição. Limite diário e intervalo mínimo de quatro horas. Para pausar: cloudEnabled=false. Preserve state/history.json.

Histórico: Amazon Kingston /3, Redragon Cobra /5 e Uniwity /6. O Uniwity foi a primeira foto enviada pelo bot na nuvem em 06/10 às 19:26, a partir da fila anterior e sem preço. Os três itens restantes dessa fila ficam inativos no modo API. A primeira publicação com preço oficial aguarda o próximo horário diário. Amazon permanece fora da descoberta automática enquanto faltam dados autorizados.

Validação: 28 testes e consulta real autenticada aprovados na execução #18, com três produtos, fotos, preços e links. Nenhum produto da consulta de teste foi publicado. Nenhuma conversa pessoal ou sessão de WhatsApp foi acessada.

- [Canal](https://t.me/RespawnOfertasYuri)
- [Teste da API](https://github.com/yuri434/respawn-ofertas/actions/runs/37541513543)
- [GitHub Actions](https://github.com/yuri434/respawn-ofertas/actions/workflows/canal.yml)
- [Agendamento GitHub](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)
