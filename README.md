# Respawn Ofertas — foto, preço e cupom

Canal público autorizado: https://t.me/RespawnOfertasYuri. Repositório privado: https://github.com/yuri434/respawn-ofertas.

## Estado em 05/10/2026

A integração oficial Telegram funciona: o bot @RespawnOfertas_bot publicou um teste de texto com Kingston DDR5 16 GB, https://t.me/RespawnOfertasYuri/3. A API e a página pública confirmaram a mensagem. O histórico foi preservado.

Após o usuário pedir foto e cupom quando disponível, novas publicações foram bloqueadas (cloudEnabled=false) e o agendamento foi retirado. O modo atual é verified_offer: não publica texto como alternativa a uma foto ausente.

O usuário autorizou a conferência manual enquanto aguarda as APIs. Em 05/10 às 20:06, foi publicado pelo Telegram Web o Redragon Cobra M711 V3 com foto exata de 800×800 fornecida pelo portal de afiliados Shopee, preço informado de R$169,99 e o link gerado na conta: https://t.me/RespawnOfertasYuri/5. O cupom foi omitido porque a página da loja bloqueou sua verificação. A mensagem e a foto foram conferidas no próprio canal, e o histórico foi sincronizado no GitHub. Essa publicação manual adicional demonstra o formato; não altera o limite diário do bot nem ativa agendamento. O registro da fonte está em oferta-manual-redragon.json.

A conta Amazon mostra que ainda não tem aprovação para solicitar a Creators API. A mesma tela informa exigência de 10 vendas qualificadas nos últimos 30 dias para a API de produtos. Portanto, não existe integração ativa para buscar fotos, preços ou cupons automaticamente. Não foram geradas credenciais. O portal Shopee também informou que a conta não tem acesso à Open API; Aplicar está desativado e a página pede contato com o suporte. Não foram lidas ou criadas chaves Shopee. O canal foi salvo na lista de sites da Amazon; isso não significa aprovação final.

## Formato preparado

Foto do produto exato, título, preço conferido e condições da compra, cupom somente quando válido para esse produto, link de afiliado completo, data da conferência e avisos de publicidade. Legenda de até 1.024 caracteres. Fotos exigem autorização que permita divulgação no Telegram. Não copiar fotos e cupons de outros canais como se fossem da sua conta.

O módulo offers.mjs exige objeto offer com itemId do catálogo, verified=true, sourceUrl e checkedAt de até uma hora. image contém url HTTPS, itemId correspondente, checkedAt de até 24 horas, telegramUseAllowed=true e authorizationSourceUrl que documente a permissão. price exige currency=BRL, cents em centavos inteiros positivos, verified=true, conditions e sourceUrl. coupon pode ser null; se existir, precisa code, verified=true, sourceUrl, conditions, checkedAt de até uma hora e expiresAt futuro. Para Amazon, dataProvider exige Creators API, PA API ou Amazon Data Feed; preço copiado de página não atende essa validação. São registros de conferência, não uma integração automática com as lojas. Não preencher confirmação, autorização ou data sem verificar a fonte real. Preços não são reduzidos automaticamente a partir do código de cupom.

Os 12 itens Amazon existentes não têm offer completo e permanecem pendentes. Os 54 candidatos Shopee ficam fora da fila ativa. As fixtures de testes usam example.com e valores sintéticos; nunca são copiadas ao catálogo real.

## Privacidade e confiabilidade

O Secret TELEGRAM_BOT_TOKEN foi preenchido diretamente pelo usuário no GitHub; o valor não foi lido nem salvo no projeto. O bot usa somente a API oficial, com o bot 8112013305 e canal -1003910154291 fixados. Não usa sessão ou senha da conta pessoal. A rotina WhatsApp continua pausada.

Reserva e persiste o histórico antes do envio, exige confirmação de foto, legenda e canal, e bloqueia repetição após resposta ambígua. Manter state/history.json. Não executar cópias com históricos independentes. Sem foto, fonte atual ou cupom válido, adia o produto.

20 testes passaram localmente e no GitHub (https://github.com/yuri434/respawn-ofertas/actions/runs/37384513700), incluindo foto ausente, autorização ausente, produto diferente, preço e cupom vencidos, legenda longa, confirmação da foto e preservação do link. A publicação manual com foto foi confirmada; o envio real de foto pelo bot em nuvem ainda precisa ser testado quando houver uma fonte ativa.

## Próxima ativação

Conectar uma fonte autorizada de imagens e condições das lojas, obter uma oferta real completa, publicar um teste e conferir o próprio canal. Só depois reativar cloudEnabled e o cron diário 17 19 * * * com timezone America/Sao_Paulo. O GitHub executará com o PC desligado, mas pode atrasar ou perder execuções. Atualmente não há agendamento ativo.

GitHub Free foi conferido: 2.000 minutos mensais compartilhados, orçamento Actions zero dólares com Stop usage ligado. Execuções manuais podem consumir a franquia. O job tem limite de cinco minutos.

Conferir sem enviar: Actions → Respawn Ofertas no Telegram → Run workflow → check. O modo verify confere bot e canal; publish fica bloqueado pela configuração atual.

## Fontes

- [Telegram sendPhoto](https://core.telegram.org/bots/api#sendphoto).
- [Creators API da própria conta](https://associados.amazon.com.br/creatorsapi).
- [Recursos de catálogo Amazon](https://associados.amazon.com.br/creatorsapi/docs/en-us/api-reference).
- [Políticas de Associados Amazon](https://associados.amazon.com.br/help/operating/policies).
- [Agendamento GitHub](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule).


