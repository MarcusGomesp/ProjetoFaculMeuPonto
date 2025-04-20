class CadastroService {
    constructor() {
        this.apiUrl = "https://localhost:7212/api/Cadastro";
    }

    async cadastrarUsuario(usuario) {
        try {
            const response = await fetch(this.apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(usuario)
            });

            if (!response.ok) {
                throw new Error("Erro ao cadastrar usuário");
            }

            return await response.json();
        } catch (error) {
            console.error("Erro no cadastro:", error);
            throw error;
        }
    }
}

// Captura o evento do formulário de cadastro
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("cadastro-form");
    const cadastroService = new CadastroService();

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
    
        const nome = form.elements["nome"].value;
        const cargo = form.elements["cargo"].value;
        const departamento = form.elements["departamento"].value;
        const email = form.elements["email"].value;
        const cpf = parseInt(form.elements["cpf"].value);
        const senha = form.elements["senha"].value;
        const confirmarSenha = form.elements["confirmarSenha"].value;
    
        // Valida se as senhas são iguais
        if (senha !== confirmarSenha) {
            alert("As senhas não coincidem!");
            return;
        }
    
        const usuario = {
            Nome: nome,
            Cargo: cargo,
            Departamento: departamento,
            Email: email,
            CPF: cpf,
            Senha: senha
        };
    
        try {
            const resultado = await cadastroService.cadastrarUsuario(usuario);
            alert("Cadastro realizado com sucesso!");
            console.log(resultado);
    
            // Redireciona para outra página
            window.location.href = "Login.html";
        } catch (error) {
            alert("Erro ao cadastrar");
        }
    });    
});
