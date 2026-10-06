import { channelTarget, channelUsername } from './core.mjs';
import { checkedPhotoBytes } from './photos.mjs';

export function createTelegram(config, token, fetchImpl = fetch) {
  if (!/^\d+:[a-zA-Z0-9_-]{20,}$/.test(token ?? '')) throw new Error('Configure TELEGRAM_BOT_TOKEN nos Secrets do GitHub; não coloque a chave em arquivos ou no chat.');
  const allowed = new Set(['getMe', 'getChat', 'getChatMember', 'sendMessage', 'sendPhoto', 'getUpdates']);
  async function call(method, body, multipart = false) {
    if (!allowed.has(method)) throw new Error('Método Telegram não autorizado.');
    let response, data;
    try {
      response = await fetchImpl('https://api.telegram.org/bot' + token + '/' + method, {
        method: 'POST', redirect: 'error', headers: multipart ? {} : { 'Content-Type': 'application/json' },
        body: multipart ? body : JSON.stringify(body), signal: AbortSignal.timeout(20000)
      });
      data = await response.json();
    } catch { throw new Error('Falha de comunicação com Telegram em ' + method + '. A chave não será exibida.'); }
    if (!response.ok || data.ok !== true) throw new Error('Telegram recusou ' + method + ' (código ' + (Number(data.error_code) || response.status) + ').');
    return data.result;
  }
  async function verify() {
    const bot = await call('getMe', {});
    if (!bot.is_bot || (config.bot.id && bot.id !== config.bot.id) || (config.bot.username && bot.username !== config.bot.username)) throw new Error('Bot diferente do configurado.');
    const target = channelTarget(config);
    const chat = await call('getChat', { chat_id: target });
    const publicUsernameMatches = config.channel.visibility === 'private' || chat.username?.toLowerCase() === channelUsername(config).toLowerCase();
    if (chat.type !== 'channel' || chat.title !== config.channel.name || !publicUsernameMatches || (config.channel.id && chat.id !== config.channel.id)) throw new Error('Destino diferente do canal autorizado.');
    const membership = await call('getChatMember', { chat_id: chat.id, user_id: bot.id });
    if (membership.user?.id !== bot.id || membership.status !== 'administrator' || membership.can_post_messages !== true) throw new Error('O bot precisa ser administrador do canal com permissão de publicar.');
    return { bot: { id: bot.id, username: bot.username }, channel: { id: chat.id, name: chat.title, url: config.channel.url } };
  }
  return {
    verify,
    async sendLocalPhoto(photo, caption) {
      if (!Number.isSafeInteger(config.channel.id) || config.channel.id >= 0 || !/^imagens\/[a-z0-9-]+\.jpg$/.test(photo.path ?? '') || [...caption].length > 1024) throw new Error('Foto local, legenda ou canal inválido.');
      const bytes = await checkedPhotoBytes(photo);
      const form = new FormData();
      form.set('chat_id', String(config.channel.id));
      form.set('caption', caption);
      form.set('allow_paid_broadcast', 'false');
      form.set('photo', new Blob([bytes], { type: 'image/jpeg' }), photo.path.split('/').pop());
      return call('sendPhoto', form, true);
    },
    async discover() {
      const bot = await call('getMe', {});
      if (!bot.is_bot || (config.bot.id && bot.id !== config.bot.id) || (config.bot.username && bot.username !== config.bot.username)) throw new Error('Bot diferente do configurado.');
      // Consultar só eventos de mudança da permissão do próprio bot; não guardar ou emitir outros campos.
      const updates = await call('getUpdates', { allowed_updates: ['my_chat_member'], limit: 100, timeout: 0 });
      const found = new Map();
      for (const update of updates) {
        const event = update.my_chat_member;
        if (event?.chat?.type !== 'channel' || event.chat.title !== config.channel.name || event.new_chat_member?.user?.id !== bot.id || event.new_chat_member.status !== 'administrator' || event.new_chat_member.can_post_messages !== true) continue;
        found.set(event.chat.id, { id: event.chat.id, name: event.chat.title });
      }
      // A saída é uma proposta de ID; nunca seleciona automaticamente o destino nem publica.
      return { bot: { id: bot.id, username: bot.username }, candidates: [...found.values()], requiresChannelConfirmation: true, published: false };
    },
    async sendPhoto(photo, caption) {
      if (!Number.isSafeInteger(config.channel.id) || config.channel.id >= 0) throw new Error('Canal numérico ainda não conferido.');
      const url = new URL(photo);
      if (url.protocol !== 'https:' || url.username || url.password || [...caption].length > 1024) throw new Error('Foto ou legenda inválida.');
      return call('sendPhoto', { chat_id: config.channel.id, photo, caption, allow_paid_broadcast: false });
    },
    async send(text) {
      if (!Number.isSafeInteger(config.channel.id) || config.channel.id >= 0) throw new Error('Canal numérico ainda não conferido.');
      return call('sendMessage', { chat_id: config.channel.id, text, link_preview_options: { is_disabled: true }, allow_paid_broadcast: false });
    }
  };
}
