document.addEventListener("DOMContentLoaded", () => {
    carregarNomeUsuario();
    carregarImagemPerfil();
    carregarSolicitacoesGestao();
    carregarGerenciamento();
});

function toggleMenu() {
    const menu = document.getElementById("dropdownMenu");
    menu.style.display = menu.style.display === "block" ? "none" : "block";
}

document.addEventListener("click", function (event) {
    const menu = document.getElementById("dropdownMenu");
    const userMenu = document.querySelector(".user-menu");
    if (!userMenu.contains(event.target)) {
        menu.style.display = "none";
    }
});

async function carregarNomeUsuario() {
    const email = localStorage.getItem("emailUsuario");
    if (!email) return;

    try {
        const response = await fetch(`https://localhost:7212/api/cadastro/usuario?email=${encodeURIComponent(email)}`);
        const usuario = await response.json();
        document.getElementById("userName").textContent = usuario.nome || "Usuário";
        localStorage.setItem("cadastroId", usuario.userId);
        if (usuario.urlProfilePic) {
            localStorage.setItem("urlProfilePic", usuario.urlProfilePic);
            document.getElementById("profilePic").src = `data:image/png;base64,${usuario.urlProfilePic}`;
        }
    } catch (error) {
        console.error("Erro ao carregar nome:", error);
    }
}

function carregarImagemPerfil() {
    const foto = localStorage.getItem("urlProfilePic");
    const img = document.getElementById("profilePic");
    img.src = foto ? `data:image/png;base64,${foto}` : "img/profile.jpg";
}

document.getElementById('uploadInput').addEventListener('change', async function (event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = async function () {
        const base64Image = reader.result.replace(/^data:image\/[a-z]+;base64,/, "");
        const cadastroId = localStorage.getItem("cadastroId");
        if (!cadastroId) return alert("ID não encontrado.");

        try {
            const response = await fetch(`https://localhost:7212/api/perfil/Imagem/${cadastroId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ urlImagem: base64Image })
            });

            if (!response.ok) throw new Error("Erro ao enviar imagem");

            localStorage.setItem("urlProfilePic", base64Image);
            document.getElementById("profilePic").src = `data:image/png;base64,${base64Image}`;
            alert("Imagem atualizada com sucesso!");
        } catch (error) {
            console.error("Erro ao enviar imagem:", error);
        }
    };
});

async function carregarSolicitacoesGestao() {
    const tbody = document.querySelector(".solicitacoes tbody");
    tbody.innerHTML = "";

    try {
        const response = await fetch("https://localhost:7212/api/solicitacao/gestao");
        if (!response.ok) throw new Error("Erro ao buscar solicitações.");

        let solicitacoes = await response.json();

        solicitacoes.sort((a, b) => b.idSolicitacao - a.idSolicitacao);
        solicitacoes = solicitacoes.slice(0, 10);

        solicitacoes.forEach(s => {
            const tr = document.createElement("tr");
            const status = traduzirStatus(s.status);

            let acoes = `
                <button class="btn editar" data-id="${s.idSolicitacao}">✏️</button>
                <button class="btn deletar" data-id="${s.idSolicitacao}">🗑️</button>
            `;

            if (s.status === 0) {
                acoes += `
                    <button class="btn aprovar" data-id="${s.idSolicitacao}">✅</button>
                    <button class="btn recusar" data-id="${s.idSolicitacao}">❌</button>
                `;
            }

            tr.innerHTML = `
                <td>#${s.idSolicitacao}</td>
                <td>${s.nomeUsuario}</td>
                <td>${s.observacao || "-"}</td>
                <td><span class="badge">${status}</span></td>
                <td class="btn-group">${acoes}</td>
            `;

            tbody.appendChild(tr);
        });

        adicionarEventosGestao();
    } catch (error) {
        console.error("Erro ao carregar solicitações:", error);
        alert("Erro ao carregar solicitações.");
    }
}



function adicionarEventosGestao() {
    document.querySelectorAll(".aprovar").forEach(btn => {
        btn.addEventListener("click", () => atualizarStatus(btn.dataset.id, true));
    });

    document.querySelectorAll(".recusar").forEach(btn => {
        btn.addEventListener("click", () => atualizarStatus(btn.dataset.id, false));
    });

    document.querySelectorAll(".deletar").forEach(btn => {
        btn.addEventListener("click", async () => {
            const id = btn.dataset.id;
            if (confirm("Deseja excluir esta solicitação?")) {
                try {
                    const resp = await fetch(`https://localhost:7212/api/solicitacao/${id}`, { method: "DELETE" });
                    if (!resp.ok) throw new Error("Erro ao deletar");
                    alert("Solicitação deletada com sucesso.");
                    carregarSolicitacoesGestao();
                } catch (err) {
                    console.error("Erro ao excluir:", err);
                    alert("Erro ao excluir solicitação.");
                }
            }
        });
    });

    document.querySelectorAll(".editar").forEach(btn => {
        btn.addEventListener("click", async () => {
            const id = btn.dataset.id;
            const novaJustificativa = prompt("Nova justificativa:");
            const novoHorario = prompt("Novo horário (HH:mm):");

            if (novaJustificativa && novoHorario) {
                const body = {
                    horario: novoHorario.length === 5 ? `${novoHorario}:00` : novoHorario,
                    observacao: novaJustificativa
                };

                try {
                    const resp = await fetch(`https://localhost:7212/api/solicitacao/${id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(body)
                    });

                    if (!resp.ok) throw new Error("Erro ao atualizar");
                    alert("Solicitação atualizada com sucesso!");
                    carregarSolicitacoesGestao();
                } catch (e) {
                    console.error("Erro ao editar:", e);
                    alert("Erro ao editar solicitação.");
                }
            }
        });
    });
}

async function atualizarStatus(id, aprovar) {
    if (aprovar) {
        const solicitacao = await buscarSolicitacaoPorId(id);
        if (solicitacao?.horario?.startsWith('-')) {
            alert("Não é possível aprovar uma solicitação com horário negativo.");
            return;
        }
    }

    const url = `https://localhost:7212/api/solicitacao/${aprovar ? "aprovar" : "rejeitar"}/${id}`;
    try {
        const response = await fetch(url, { method: "PUT" });
        const msg = await response.json();
        if (!response.ok) throw new Error(msg.message || "Erro");

        alert(msg.message || "Status atualizado.");
        carregarSolicitacoesGestao();
    } catch (error) {
        console.error("Erro ao atualizar status:", error);
        alert("Erro ao atualizar status.");
    }
}


async function buscarSolicitacaoPorId(id) {
    try {
        const response = await fetch(`https://localhost:7212/api/solicitacao/${id}`);
        if (!response.ok) throw new Error("Erro ao buscar solicitação");
        return await response.json();
    } catch (err) {
        console.error("Erro ao buscar solicitação por ID:", err);
        return null;
    }
}

async function carregarGerenciamento() {
    const tbody = document.getElementById("gerenciamento-body");
    tbody.innerHTML = "";

    try {
        const response = await fetch("https://localhost:7212/api/registro/gestao");
        if (!response.ok) throw new Error("Erro ao buscar dados de gerenciamento.");

        let usuarios = await response.json();

        usuarios.sort((a, b) => {
            const [ah, am] = a.horasExtras.split(':').map(Number);
            const [bh, bm] = b.horasExtras.split(':').map(Number);
            return (bh * 60 + bm) - (ah * 60 + am);
        });

        usuarios = usuarios.slice(0, 10); 

        usuarios.forEach(u => {
            const tr = document.createElement("tr");

            tr.innerHTML = `
                <td>
                    <img src="${u.fotoBase64 ? `data:image/png;base64,${u.fotoBase64}` : 'img/profile.jpg'}" class="avatar">
                    ${u.nome}
                </td>
                <td class="${calcularStatusClass(u.horasExtras)}">${u.horasExtras || "00:00"}</td>
                <td><a href="">Visualizar histórico</a></td>
                <td>${u.qtdeBatidas}</td>
            `;

            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error("Erro ao carregar gerenciamento:", error);
    }
}



function calcularStatusClass(horasExtras) {
    if (!horasExtras || horasExtras === "00:00") return "";
    const [h, m] = horasExtras.split(":").map(Number);
    const totalMinutos = h * 60 + m;
    return totalMinutos >= 0 ? "positivo" : "negativo";
}

function traduzirStatus(status) {
    switch (status) {
        case 0: return "Pendente";
        case 1: return "Aprovado";
        case 2: return "Rejeitado";
        default: return "Desconhecido";
    }
}
