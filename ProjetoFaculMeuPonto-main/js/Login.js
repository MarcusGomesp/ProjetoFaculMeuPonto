class LoginService {
    constructor() {
        this.apiUrl = "https://localhost:7113/api/cadastro/login";  
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
            console.log("Dados retornados da API:", data); 
            return data;
        } catch (error) {
            console.error("Erro no login:", error);
            throw error;
        }
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.querySelector(".login-box form");
    const loginService = new LoginService();

    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const emailInput = loginForm.querySelector("input[type='email']");
        const passwordInput = loginForm.querySelector("input[type='password']");

        const credenciais = { Email: emailInput.value, Senha: passwordInput.value };

        try {
            const data = await loginService.autenticarUsuario(credenciais);

            if (data && data.email && data.nome) {  
                localStorage.setItem("emailUsuario", data.email);
                localStorage.setItem("nomeUsuario", data.nome);
                console.log("Dados salvos no localStorage:", data.email, data.nome); 
                window.location.replace("PaginaMenu.html");  
            } else {
                alert("Falha ao autenticar. E-mail ou nome não retornado.");
            }
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
