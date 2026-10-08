# Rotina automática do Respawn Ofertas

Atualização em 08/10/2026. O cron-job.org, job 8608337, envia POST à API GitHub a cada cinco minutos, no fuso America/Sao_Paulo. O corpo é {"ref":"main","inputs":{"mode":"publish"}}. O workflow roda no GitHub mesmo com o PC desligado. Na interface GitHub, esses acionamentos aparecem como Manually triggered porque utilizam workflow_dispatch.

O cron interno GitHub foi substituído: as quatro execuções schedule observadas entre 07/10 22:20 e 08/10 17:15 tiveram intervalos de 5h23 a 7h20. Trocar o minuto inicial e reativar o workflow não resolveu. A alternativa externa remove essa dependência; o início do runner ainda pode sofrer atraso, e uma publicação exige produto elegível.

O teste pelo cron-job.org retornou HTTP 200, iniciou a execução #28 e publicou o post /14 com foto, preço mínimo, link de afiliado original e identificação publicitária. HTTP 200 confirma o acionamento, não a postagem: verificar resultado do workflow e histórico Telegram. Os disparos automáticos observados ficam registrados em preparacao-status.json.

Alterna 30 categorias de tecnologia e jogos a cada janela, consultando a API oficial Shopee até quatro vezes. Usa foto oficial, preço da API, oferta vigente, link integral de afiliado, avaliações, vendas e tipo de loja. Não inventa cupons, descontos, compatibilidade ou desempenho. A consulta atual não fornece campo de cupom. Amazon permanece fora da descoberta automática.

Limite de uma publicação por janela de cinco minutos, até 288 por dia; distância mínima de quatro minutos para tolerar atraso pequeno. O histórico bloqueia IDs e links já publicados e envios com confirmação pendente. Bot e canal são fixos e conferidos pela API Telegram antes do envio. Reserva persistida antes da publicação; confirmação depois. O salvamento tenta o mesmo commit até três vezes, sem repetir o envio; cada execução consulta main atual.

Credenciais Shopee e Telegram ficam nos Secrets do GitHub. O token limitado ao repositório respawn-ofertas, Actions read/write e Metadata read, fica no cabeçalho Authorization do cron-job.org, inserido pelo usuário. A resposta autenticada GitHub informou vencimento em 06/01/2027, 23:00:37 UTC. Renovar antes dessa data e atualizar o cabeçalho diretamente, sem colocar valores em arquivos, logs ou chat.

Para pausar o agendador: cron-job.org → job 8608337 → desmarcar Enable job → Save. Para bloquear todos os envios, inclusive manuais: cloudEnabled=false em config.json. Não limpar state/history.json nem rodar uma cópia independente. Nenhuma sessão ou conversa pessoal WhatsApp/Telegram é utilizada.

35 testes aprovados na nuvem na execução de teste. A descoberta e o envio continuam usando os módulos existentes; a mudança de agendamento não altera filtros ou conteúdo.

[Canal](https://t.me/RespawnOfertasYuri) · [GitHub Actions](https://github.com/yuri434/respawn-ofertas/actions/workflows/canal.yml) · [cron-job.org](https://console.cron-job.org/jobs/8608337)

Verificação automática em 08/10: o cron-job.org executou às 20:05:06 (jitter 6,49 s) e 20:10:08 (jitter 8,77 s), com HTTP 200 nos dois. A primeira execução respeitou o intervalo mínimo após o teste /14. A segunda publicou o Nintendo Switch 2 no post /15 às 20:10:21 e persistiu a confirmação. Intervalo real dos acionamentos: 302,28 s. Essa amostra confirma a configuração em operação, sem garantir pontualidade permanente ou publicação quando não houver oferta elegível.
