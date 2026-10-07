# Rotina automática do Respawn Ofertas

Atualização em 07/10/2026: ativado cron 2/5 * * * * para consulta e até um envio a cada cinco minutos, com o PC desligado. O job agendado só executa em repositório público. GitHub pode atrasar ou omitir execuções; não é um temporizador pontual garantido. Sem produto completo elegível, não publica.

Alterna categorias a cada janela, consultando a API oficial Shopee até quatro vezes. Mantém foto oficial, preço, período vigente, link integral de afiliado, avaliações, vendas e tipo de loja. Não inventa cupons, descontos, compatibilidade nem desempenho. Esta API não fornece cupons. Amazon ainda não participa da descoberta automática.

Limite de uma publicação por janela de cinco minutos, até 288 por dia; distância mínima de quatro minutos para tolerar pequeno atraso do GitHub. O histórico bloqueia IDs e links já publicados e qualquer envio com confirmação pendente. Bot e canal são fixos e conferidos pela API Telegram antes de enviar. Reserva no GitHub antes da publicação; confirmação exata depois. O histórico preserva as publicações /3, /5, /6, /7 e /8. O Ryzen /7 tem preço e foto oficiais da API. O salvamento repete o mesmo commit até três vezes, sem repetir o envio; cada execução consulta main atual.

Credenciais continuam exclusivamente nos Secrets do GitHub. Nenhuma sessão ou conversa pessoal de WhatsApp/Telegram é usada. Para pausar: cloudEnabled=false. Não limpar state/history.json nem rodar outra cópia independente.

35 testes locais e na nuvem aprovados. A execução #22 após a correção publicou o Samsung A17 com foto e preço e salvou o histórico: https://github.com/yuri434/respawn-ofertas/actions/runs/37688683392 . Cron habilitado; primeiro disparo ainda em observação.

[Canal](https://t.me/RespawnOfertasYuri) · [GitHub Actions](https://github.com/yuri434/respawn-ofertas/actions/workflows/canal.yml) · [Agendamento GitHub](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)
