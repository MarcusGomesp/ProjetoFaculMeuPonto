// ---------- NOME DO USUÁRIO ----------
async function carregarNomeUsuario() {
    const email = localStorage.getItem("emailUsuario");
    if (!email) return;

    try {
        const response = await fetch(`https://localhost:7212/api/cadastro/usuario?email=${encodeURIComponent(email)}`);
        const usuario = await response.json();
        document.getElementById("userName").textContent = usuario.nome || "Usuário";
    } catch (error) {
        console.error("Erro ao carregar o nome do usuário:", error);
    }
}
document.addEventListener("DOMContentLoaded", carregarNomeUsuario);

// ---------- IMAGEM ----------
document.getElementById('uploadInput').addEventListener('change', async function (event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = async function () {
        let base64Image = reader.result.replace(/^data:image\/[a-z]+;base64,/, "");
        const cadastroId = localStorage.getItem("cadastroId");
        if (!cadastroId) return alert("ID não encontrado.");

        try {
            const response = await fetch(`https://localhost:7212/api/cadastro/Imagem/${cadastroId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imagemBase64: base64Image })
            });

            if (response.ok) {
                alert("Imagem enviada!");
                document.getElementById('profilePic').src = `data:image/png;base64,${base64Image}`;
            }
        } catch (error) {
            console.error("Erro ao enviar imagem:", error);
        }
    };
});

// ---------- MODAL ----------
function abrirFormularioSolicitacao() {
    document.getElementById("modalSolicitacao").style.display = "flex";
}

function fecharFormularioSolicitacao() {
    document.getElementById("modalSolicitacao").style.display = "none";
}


// ---------- ENVIAR SOLICITAÇÃO ----------
async function enviarSolicitacao() {
    const userId = parseInt(localStorage.getItem("cadastroId"));
    const idRegistro = parseInt(localStorage.getItem("idRegistro"));
  
    const data = document.getElementById("dataSolicitacao").value;
    const horarioRaw = document.getElementById("motivoSolicitacao").value.trim(); 
    const horarioFormatado = horarioRaw.length === 5 ? `${horarioRaw}:00` : horarioRaw; 
    const observacao = document.getElementById("justificativaSolicitacao").value.trim();
  
    if (!data || !horarioFormatado || !observacao) {
      alert("Preencha todos os campos.");
      return;
    }

    if (horarioFormatado.startsWith("-")) {
        alert("O horário não pode ser negativo. Insira um horário válido entre 00:00 e 23:59.");
        return;
    }

    const regexHorario = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
    if (!regexHorario.test(horarioFormatado)) {
        alert("Formato de horário inválido. Use o formato HH:mm ou HH:mm:ss.");
        return;
    }
  
    const body = {
        userId: userId,
        idRegistro: idRegistro,
        horario: horarioFormatado,
        status: 0,
        observacao: observacao
    };
  
    try {
        const response = await fetch("https://localhost:7212/api/solicitacao", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
  
        const respostaTexto = await response.text();
        console.log("🔍 Resposta da API:", respostaTexto);
  
        if (!response.ok) throw new Error(respostaTexto);
  
        alert("Solicitação enviada com sucesso!");
        fecharFormularioSolicitacao();
        carregarSolicitacoes();
  
    } catch (error) {
        console.error("Erro ao enviar:", error);
        alert("Erro ao enviar solicitação: " + error.message);
    }
}


  

// ---------- CARREGAR SOLICITAÇÕES ----------
async function carregarSolicitacoes() {
    const tabela = document.getElementById("tabelaSolicitacoes");
    tabela.innerHTML = "";
  
    const userId = localStorage.getItem("cadastroId");
    if (!userId) return;
  
    try {
      const response = await fetch(`https://localhost:7212/api/solicitacao/usuario/${userId}`);
      if (!response.ok) throw new Error("Erro ao buscar");
  
      const solicitacoes = await response.json();
  
      solicitacoes.forEach(s => {
        const statusLabel = traduzirStatus(s.status);
        const statusClass = statusLabel.toLowerCase();
  
        const tr = document.createElement("tr");
  
        let acoes = `
          <button class="edit-btn" data-id="${s.idSolicitacao}">✏️</button>
          <button class="delete-btn" data-id="${s.idSolicitacao}">🗑️</button>
        `;
  
        if (s.status === 0) {
          acoes += `
            <button class="aprove-btn" data-id="${s.idSolicitacao}">✅</button>
            <button class="reject-btn" data-id="${s.idSolicitacao}">❌</button>
          `;
        }
  
        tr.innerHTML = `
          <td>${formatarData(new Date())}</td>
          <td>${s.horario}</td>
          <td>${s.observacao}</td>
          <td><span class="badge status-${statusClass}">${statusLabel}</span></td>
          <td>${acoes}</td>
        `;
  
        tabela.appendChild(tr);
      });
  
      // Eventos de ação
      document.querySelectorAll(".aprove-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
          const id = btn.getAttribute("data-id");
          await atualizarStatusSolicitacao(id, true);
        });
      });
  
      document.querySelectorAll(".reject-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
          const id = btn.getAttribute("data-id");
          await atualizarStatusSolicitacao(id, false);
        });
      });
  
      document.querySelectorAll(".delete-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
          const id = btn.getAttribute("data-id");
          await deletarSolicitacao(id);
        });
      });
  
      document.querySelectorAll(".edit-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
          const id = btn.getAttribute("data-id");
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
              carregarSolicitacoes();
            } catch (e) {
              console.error("Erro ao editar:", e);
              alert("Erro ao editar solicitação.");
            }
          }
        });
      });
  
      const solicitacaoAprovada = solicitacoes.find(s => s.status === 1);
      if (solicitacaoAprovada) {
        await atualizarRegistroSeAprovado(solicitacaoAprovada);
      }
  
    } catch (error) {
      console.error("Erro ao carregar:", error);
    }
  }
  


  async function atualizarStatusSolicitacao(id, aprovar) {
    const url = `https://localhost:7212/api/solicitacao/${aprovar ? "aprovar" : "rejeitar"}/${id}`;
  
    try {
      const response = await fetch(url, {
        method: "PUT"
      });
  
      const respostaTexto = await response.text();
      console.log("🔍 Resposta da API:", respostaTexto);
  
      if (!response.ok) {
        throw new Error(respostaTexto);
      }
  
      const result = JSON.parse(respostaTexto);
      alert(result.message || "Status atualizado com sucesso!");
      carregarSolicitacoes();
  
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      alert("Erro ao atualizar status: " + error.message);
    }
  }
  



// ---------- DELETAR SOLICITAÇÃO ----------
async function deletarSolicitacao(id) {
    if (!confirm("Tem certeza que deseja excluir esta solicitação?")) return;
    try {
        const response = await fetch(`https://localhost:7212/api/solicitacao/${id}`, {
            method: "DELETE"
        });
        if (!response.ok) throw new Error("Erro ao deletar solicitação.");
        alert("Solicitação deletada.");
        carregarSolicitacoes();
    } catch (error) {
        console.error("Erro ao deletar:", error);
    }
}

// ---------- ATUALIZAR REGISTRO ----------
async function atualizarRegistroSeAprovado(solicitacao) {
    const idRegistro = solicitacao.idRegistro;
    const userId = solicitacao.userId;
    const novoHorario = solicitacao.horario;

    try {
        const response = await fetch(`https://localhost:7212/api/Registro/usuario/${userId}`);
        if (!response.ok) throw new Error("Erro ao buscar registros");

        const registros = await response.json();
        const registro = registros.find(r => r.idRegistro === idRegistro);

        if (!registro) {
            console.warn("Registro não encontrado para atualização.");
            return;
        }

        const novaData = registro.dataInicio.split("T")[0] + "T" + novoHorario;

        const body = {
            idRegistro: idRegistro,
            userId: userId,
            dataInicio: novaData,
            saidaAlmoco: registro.saidaAlmoco,
            voltaAlmoco: registro.voltaAlmoco,
            fim: registro.fim,
            totalHora: registro.totalHora,
            horarioExtra: registro.horarioExtra,
            qtdeBatidas: registro.qtdeBatidas
        };

        const updateResp = await fetch(`https://localhost:7212/api/Registro/${idRegistro}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        if (!updateResp.ok) throw new Error("Erro ao atualizar ponto");

        // alert removido
    } catch (error) {
        console.error("Erro ao atualizar registro:", error);
    }
}


// ---------- UTILITÁRIOS ----------
function traduzirStatus(status) {
    switch (status) {
        case 0: case "Pendente": return "Pendente";
        case 1: case "Aprovado": return "Aprovado";
        case 2: case "Rejeitado": return "Rejeitado";
        default: return "Desconhecido";
    }
}

function formatarData(data) {
    const dia = String(data.getDate()).padStart(2, "0");
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
}

// ---------- INICIALIZAÇÃO ----------
document.addEventListener("DOMContentLoaded", () => {
    carregarSolicitacoes();
});