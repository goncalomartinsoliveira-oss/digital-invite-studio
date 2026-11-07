// Chave secreta deste browser para as fotos dos convidados (api/photos,
// migração 0019): quem enviou uma foto pode apagá-la a partir do mesmo
// browser. Fica no localStorage; se o convidado limpar os dados do browser,
// perde a possibilidade de apagar (os noivos continuam a poder, no painel).

const STORAGE_KEY = "dis_uploader_key";

export function getUploaderKey(): string | null {
  try {
    let key = localStorage.getItem(STORAGE_KEY);
    if (!key || !/^[0-9a-f]{64}$/.test(key)) {
      const bytes = new Uint8Array(32);
      crypto.getRandomValues(bytes);
      key = Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
      localStorage.setItem(STORAGE_KEY, key);
    }
    return key;
  } catch {
    return null; // modo privado sem localStorage: envia, mas não poderá apagar
  }
}
