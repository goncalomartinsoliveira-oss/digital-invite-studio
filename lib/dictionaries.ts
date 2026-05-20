import 'server-only';

// Mapeia os ficheiros JSON que acabou de criar
const dictionaries = {
  en: () => import('@/dictionaries/en').then((module) => module.default),
  pt: () => import('@/dictionaries/pt').then((module) => module.default),
};

// Função que as nossas páginas vão chamar para ler o texto correto
export const getDictionary = async (locale: 'en' | 'pt') => {
  // Se o idioma não existir (ex: /es/), carrega o português por defeito
  if (!dictionaries[locale]) {
    return dictionaries.pt();
  }
  return dictionaries[locale]();
};