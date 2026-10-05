# Respawn Ofertas no Telegram

Preparação local, ainda sem publicação ou agendamento ativo em nuvem. A migração foi solicitada em 05/10/2026. A rotina antiga do WhatsApp foi pausada e o bot não oficial não foi vinculado.

O novo projeto usa somente a API oficial de bots do Telegram. Não precisa da sua senha, de uma sessão da sua conta, nem de vincular seu WhatsApp. O token autentica o bot e deve ficar no Secret `TELEGRAM_BOT_TOKEN` do GitHub, nunca em arquivos ou no chat. A rotina consulta a identidade do bot, confere o canal e a permissão do bot, e publica texto no canal fixado. Não busca histórico pessoal. Não configure o bot como assistente da sua conta ou bot de negócios; adicione-o somente ao canal de divulgação.

O canal **Respawn Ofertas** foi conferido no Telegram Web: é um canal privado, com convite correspondente ao informado pelo usuário. Sua privacidade foi preservada. O convite fica somente no registro local ignorado pelo Git; não vai para o repositório. O ID de envio da API ainda não foi confirmado. O endereço do navegador não foi convertido em um ID presumido.

## O que falta fazer no celular

1. Canal **Respawn Ofertas** já criado e conferido. Pode permanecer privado. Não alterar a visibilidade nem revogar o convite recebido nesta etapa.
2. Abrir o [BotFather oficial](https://t.me/BotFather), enviar `/newbot`, dar um nome ao bot e escolher um nome de usuário terminado em `bot`. Guardar o token sem mandar no chat.
3. No canal, adicionar esse bot como administrador. Dar a permissão de publicar mensagens; não conceder acesso a outros canais ou grupos nem conectar o bot às conversas pessoais.
4. Preparar um repositório privado no GitHub. Na etapa de vinculação, você colocará o token diretamente em Settings → Secrets and variables → Actions → New repository secret, com nome `TELEGRAM_BOT_TOKEN`. Antes disso, confirmar que essa chave do bot será armazenada no GitHub; ela controla o bot e seus acessos, mas não autentica sua conta pessoal.
5. Conferir os requisitos atuais dos Associados Amazon para divulgar no novo destino antes de liberar os produtos Amazon. Cadastrar um endereço na lista não confirma aprovação da conta ou do meio de divulgação. Conferir a identidade do bot e o título/ID do canal e sua permissão de publicar. Para canal privado, usar a descoberta abaixo e salvar apenas IDs conferidos no `config.json`.
6. Conferir a franquia gratuita e bloquear gastos adicionais no GitHub. Executar o teste de publicação e conferir a mensagem no canal. Só então ativar a rotina, de um item por dia, às 19h17 de São Paulo. O GitHub pode atrasar ou perder uma execução; o projeto não acumula horários perdidos.

## Descobrir o ID do canal privado

Depois de colocar o token diretamente no Secret e de adicionar o próprio bot como administrador do canal, executar manualmente o modo `discover`. Ele pede à API somente atualizações `my_chat_member`, sobre mudanças da permissão do próprio bot. Ignora todos os eventos que não sejam desse tipo, todos os chats que não sejam canais e todos os nomes diferentes de Respawn Ofertas. Não imprime nem salva outros campos ou mensagens; não publica nem escolhe automaticamente o destino. Atualizações criadas anteriormente podem vir junto na resposta e são descartadas. A saída mostra somente o ID/nome do bot e os IDs/nomes de canais correspondentes para conferência. Conferir que o evento corresponde à inclusão do bot neste canal antes de fixar o ID. Atualizações antigas podem expirar; não tentar deduzir IDs nem usar bots desconhecidos para obter esse dado.

O modo `verify` usa o ID fixado para conferir canal e permissão novamente. A rotina diária não executa `discover` nem recebe mensagens. Uma referência de mensagem privada tem formato `t.me/c/ID/MENSAGEM` e só pode ser aberta por quem tem acesso ao canal.

## Conteúdo e funcionamento

A fila inicial contém os 12 itens Amazon de PC e PS5. O foco escolhido é jogos, peças de PC, periféricos e roupas. A seleção Shopee relacionada ao tema fica em `candidatos-shopee.json`, aguardando nova conferência antes de entrar na fila. Todos os links e avisos de afiliado são preservados. O histórico Telegram começa vazio; o histórico WhatsApp fica separado. Não são promoções com descontos verificados: esta versão publica indicações sem preço ou cupom. A busca automática de novas ofertas ainda precisa de fontes e acessos próprios de cada loja.

Um anúncio Amazon que não puder ser reconferido é adiado. Não contornar verificação nem afirmar estoque, compatibilidade, desempenho, preço ou desconto. Textos Shopee vêm do catálogo previamente conferido e convidam a verificar condições no anúncio. Não usar imagens copiadas sem autorização.

O programa reserva o item e salva o histórico no repositório antes de enviar. A resposta oficial do Telegram precisa conter exatamente o texto e o ID do canal. Se a resposta faltar ou for ambígua, a fila trava; conferir o próprio canal manualmente antes de destravar, sem reenviar às cegas. Esta API não fornece uma busca geral de histórico para reconciliar automaticamente envios ambíguos. Não iniciar duas cópias do bot com históricos independentes.

Nenhuma dependência externa é necessária. Os testes usam respostas simuladas, sem conexão com Telegram. A execução real e o funcionamento com o PC desligado permanecem pendentes. A configuração `cloudEnabled` começa falsa.

GitHub Free inclui uma franquia compartilhada de execução para repositórios privados. O limite deste fluxo é de cinco minutos por execução diária, até 155 minutos em um mês de 31 dias, além de testes e outras execuções. Conferir consumo e limites da própria conta antes de ativar. O computador local pode ficar desligado depois que o agendamento hospedado e o teste estiverem confirmados.

## Fontes

- [BotFather e autenticação do bot, separada da conta](https://core.telegram.org/bots/tutorial).
- [API oficial: getMe, getChat, getChatMember e sendMessage](https://core.telegram.org/bots/api).
- [Franquia e cobrança GitHub Actions](https://docs.github.com/en/billing/concepts/product-billing/github-actions).
- [Agendamento e possíveis atrasos](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule).

Validação atual: 15 testes passaram, incluindo ID fixado de canal privado, referência de mensagem e descoberta limitada à permissão do bot. Esses testes usam respostas simuladas; nenhum token Telegram foi salvo e nenhum envio real foi feito. O usuário informou o bot `@RespawnOfertas_bot`, cujo ID numérico ainda aguarda conferência na API.

O fluxo salvo neste estágio só tem execução manual, para não consumir franquia com agendamentos antes da conferência. Incluir o agendamento diário somente depois de conferir a franquia gratuita, o token e o envio de teste.
