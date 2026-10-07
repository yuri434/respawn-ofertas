# Rotina automática do Respawn Ofertas

Atualização em 07/10/2026: preparado cron */5 * * * * para consulta e até um envio a cada cinco minutos, com o PC desligado. O job agendado só executa em repositório público. GitHub pode atrasar ou omitir execuções; não é um temporizador pontual garantido. Sem produto completo elegível, não publica.

Alterna categorias a cada janela, consultando a API oficial Shopee até quatro vezes. Mantém foto oficial, preço, período vigente, link integral de afiliado, avaliações, vendas e tipo de loja. Não inventa cupons, descontos, compatibilidade nem desempenho. Esta API não fornece cupons. Amazon ainda não participa da descoberta automática.

Limite de uma publicação por janela de cinco minutos, até 288 por dia; distância mínima de quatro minutos para tolerar pequeno atraso do GitHub. O histórico bloqueia IDs e links já publicados e qualquer envio com confirmação pendente. Bot e canal são fixos e conferidos pela API Telegram antes de enviar. Reserva no GitHub antes da publicação; confirmação exata depois. O histórico preserva as publicações /3, /5 e /6.

Credenciais continuam exclusivamente nos Secrets do GitHub. Nenhuma sessão ou conversa pessoal de WhatsApp/Telegram é usada. Para pausar: cloudEnabled=false. Não limpar state/history.json nem rodar outra cópia independente.

31 testes locais aprovados na nova cadência. A confirmação de implantação, foto com preço e cron será registrada após testes reais.

[Canal](https://t.me/RespawnOfertasYuri) · [GitHub Actions](https://github.com/yuri434/respawn-ofertas/actions/workflows/canal.yml) · [Agendamento GitHub](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)
