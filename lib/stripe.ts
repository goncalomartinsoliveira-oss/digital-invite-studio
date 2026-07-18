import Stripe from "stripe";

// Cliente Stripe do lado do servidor. Nunca importar este ficheiro em
// componentes "use client" — a chave secreta não pode chegar ao browser.
// Sem "apiVersion" fixo: usa a versão por definição do SDK instalado.
//
// O construtor do Stripe rejeita uma apiKey vazia — por isso, enquanto a
// env var não estiver configurada (ex.: build de preview sem segredos),
// usamos um valor de preenchimento só para não rebentar o build/arranque
// da aplicação inteira. Qualquer tentativa real de checkout com esta chave
// falsa falha em runtime com um erro claro do Stripe, o que é o
// comportamento correto (só as rotas de pagamento ficam por configurar).
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder_not_configured");
