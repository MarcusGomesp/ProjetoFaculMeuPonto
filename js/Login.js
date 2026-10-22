class LoginService {
    constructor() {
        this.apiUrl = "https://localhost:7212/api/Cadastro/login";
    }

    async autenticarUsuario(credenciais) {
        try {
            const response = await fetch(this.apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(credenciais)
            });

            if (!response.ok) {
                throw new Error("Erro ao autenticar usuário");
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Erro no login:", error);
            throw error;
        }
    }
}

document.addEventListener("DOMContentLoaded", function () {
    // Abrir a tela de login (inclusive pelo link "Sair") encerra a sessão anterior
    localStorage.removeItem("token");
    localStorage.removeItem("tokenExpiraEm");

    const loginForm = document.querySelector(".login-box form");
    const loginService = new LoginService();

    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const emailInput = loginForm.querySelector("input[type='email']");
        const passwordInput = loginForm.querySelector("input[type='password']");

        const credenciais = {
            Email: emailInput.value,
            Senha: passwordInput.value
        };

        try {
            const data = await loginService.autenticarUsuario(credenciais);

            const cadastroId = parseInt(data?.cadastroId);
            const idRegistro = data?.idRegistro;

            if (!data || !data.token || !data.email || !data.nome || isNaN(cadastroId)) {
                alert("Falha ao autenticar. Dados inválidos.");
                console.error("❌ Dados inválidos recebidos:", data);
                return;
            }

            localStorage.clear();

            // Token JWT: enviado pelo apiFetch (js/api.js) em todas as chamadas protegidas
            localStorage.setItem("token", data.token);
            if (data.expiraEm) localStorage.setItem("tokenExpiraEm", data.expiraEm);

            localStorage.setItem("emailUsuario", data.email);
            localStorage.setItem("nomeUsuario", data.nome);
            localStorage.setItem("cadastroId", cadastroId.toString());

            if (idRegistro !== null && idRegistro !== undefined) {
                localStorage.setItem("idRegistro", idRegistro.toString());
            }

            if (data.urlProfilePic) {
                localStorage.setItem("urlProfilePic", data.urlProfilePic);
            }

            console.log("✅ Dados salvos no localStorage:", {
                email: data.email,
                nome: data.nome,
                cadastroId,
                idRegistro
            });

            window.location.replace("PaginaMenu.html");
        } catch (error) {
            console.error("Erro ao fazer login:", error);
            alert("Erro ao fazer login. Verifique suas credenciais.");
        }
    });
});

if (window.history && window.history.pushState) {
    window.history.pushState(null, "", window.location.href);
    window.onpopstate = function () {
        window.history.pushState(null, "", window.location.href);
    };
}
