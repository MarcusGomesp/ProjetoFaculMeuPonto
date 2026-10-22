/*
 * Cliente HTTP da API MeuPonto.
 *
 * Desde a autenticação JWT, todas as rotas da API (menos cadastro e login)
 * exigem o cabeçalho "Authorization: Bearer <token>". Este arquivo centraliza
 * isso: as páginas chamam apiFetch() no lugar de fetch() e o token salvo no
 * login é enviado automaticamente.
 *
 * Carregue este script ANTES dos scripts de cada página protegida.
 */
const Auth = {
  TOKEN_KEY: "token",
  EXPIRA_KEY: "tokenExpiraEm",

  salvar(token, expiraEm) {
    localStorage.setItem(this.TOKEN_KEY, token);
    if (expiraEm) localStorage.setItem(this.EXPIRA_KEY, expiraEm);
  },

  obterToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  },

  expirado() {
    const expiraEm = localStorage.getItem(this.EXPIRA_KEY);
    return expiraEm ? Date.now() >= new Date(expiraEm).getTime() : false;
  },

  sair() {
    localStorage.clear();
    window.location.replace("Login.html");
  },
};

/** fetch() com o token JWT no cabeçalho; em 401 (token inválido/expirado) volta para o login. */
async function apiFetch(url, options = {}) {
  const token = Auth.obterToken();
  if (!token || Auth.expirado()) {
    Auth.sair();
    throw new Error("Sessão expirada. Faça login novamente.");
  }

  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    Auth.sair();
    throw new Error("Sessão expirada. Faça login novamente.");
  }

  return response;
}

// Página protegida aberta sem login (ou com sessão vencida): volta para o login.
if (!Auth.obterToken() || Auth.expirado()) {
  Auth.sair();
}
