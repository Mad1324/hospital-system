const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// ==============================
// FRONTEND
// ==============================

const FRONTEND_DIR = path.join(__dirname, "../frontend");

app.use(express.static(FRONTEND_DIR));

// ==============================
// BANCO DE DADOS
// ==============================

const DB_FILE = path.join(__dirname, "db.json");

function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    const bancoInicial = {
      usuarios: [
        {
          usuario: "admin",
          senha: "1234",
          tipo: "triagem"
        },
        {
          usuario: "medico",
          senha: "1234",
          tipo: "medico"
        },
        {
          usuario: "atendimento",
          senha: "1234",
          tipo: "atendimento"
        }
      ],
      pacientes: [],
      triagens: [],
      consultas: [],
      tv_chamada: null,
      tv_historico: []
    };

    writeDB(bancoInicial);

    return bancoInicial;
  }

  try {
    const db = JSON.parse(
      fs.readFileSync(DB_FILE, "utf8")
    );

    if (!db.usuarios) db.usuarios = [];
    if (!db.pacientes) db.pacientes = [];
    if (!db.triagens) db.triagens = [];
    if (!db.consultas) db.consultas = [];
    if (!db.tv_historico) db.tv_historico = [];

    if (!("tv_chamada" in db)) {
      db.tv_chamada = null;
    }

    return db;

  } catch (erro) {
    console.error(
      "Erro ao ler o banco de dados:",
      erro
    );

    return {
      usuarios: [],
      pacientes: [],
      triagens: [],
      consultas: [],
      tv_chamada: null,
      tv_historico: []
    };
  }
}

function writeDB(data) {
  fs.writeFileSync(
    DB_FILE,
    JSON.stringify(data, null, 2),
    "utf8"
  );
}

// ==============================
// PÁGINA INICIAL
// ==============================

app.get("/", (req, res) => {
  res.sendFile(
    path.join(FRONTEND_DIR, "index.html")
  );
});

// ==============================
// LOGIN
// ==============================

app.post("/login", (req, res) => {
  try {
    const { usuario, senha } = req.body;

    if (!usuario || !senha) {
      return res.status(400).json({
        erro: "Usuário e senha são obrigatórios."
      });
    }

    const db = readDB();

    const user = db.usuarios.find(
      u =>
        u.usuario === usuario &&
        u.senha === senha
    );

    if (!user) {
      return res.status(401).json({
        erro: "Usuário ou senha inválidos."
      });
    }

    res.json({
      usuario: user.usuario,
      tipo: user.tipo
    });

  } catch (erro) {
    console.error(
      "Erro no login:",
      erro
    );

    res.status(500).json({
      erro: "Erro interno no servidor."
    });
  }
});

// ==============================
// ATENDIMENTO
// ==============================

app.post("/atendimento", (req, res) => {
  try {
    const db = readDB();

    const paciente = {
      id: Date.now(),
      nome: req.body.nome,
      cpf: req.body.cpf,
      tipo: req.body.tipo,
      status: "triagem",
      createdAt: new Date().toISOString()
    };

    db.pacientes.push(paciente);

    writeDB(db);

    res.json(paciente);

  } catch (erro) {
    console.error(
      "Erro ao cadastrar paciente:",
      erro
    );

    res.status(500).json({
      erro: "Erro ao cadastrar paciente."
    });
  }
});

// ==============================
// LISTAR PACIENTES
// ==============================

app.get("/pacientes", (req, res) => {
  try {
    const db = readDB();

    res.json(db.pacientes);

  } catch (erro) {
    console.error(
      "Erro ao listar pacientes:",
      erro
    );

    res.status(500).json({
      erro: "Erro ao buscar pacientes."
    });
  }
});

// ==============================
// TRIAGEM
// ==============================

app.post("/triagem", (req, res) => {
  try {
    const db = readDB();

    let risco = req.body.risco;

    const temperatura = Number(
      req.body.temperatura
    );

    if (temperatura >= 39) {
      risco = "vermelho";
    } else if (temperatura >= 38) {
      risco = "amarelo";
    } else if (!risco) {
      risco = "verde";
    }

    const triagem = {
      id: Date.now(),
      nome: req.body.nome,
      sintoma: req.body.sintoma,
      temperatura: temperatura,
      alergia: req.body.alergia,
      observacao: req.body.observacao,
      risco: risco,
      status: "aguardando_medico",
      createdAt: new Date().toISOString()
    };

    db.triagens.push(triagem);

    writeDB(db);

    res.json(triagem);

  } catch (erro) {
    console.error(
      "Erro na triagem:",
      erro
    );

    res.status(500).json({
      erro: "Erro ao realizar triagem."
    });
  }
});

// ==============================
// LISTAR TRIAGENS
// ==============================

app.get("/triagens", (req, res) => {
  try {
    const db = readDB();

    res.json(db.triagens);

  } catch (erro) {
    console.error(
      "Erro ao listar triagens:",
      erro
    );

    res.status(500).json({
      erro: "Erro ao buscar triagens."
    });
  }
});

// ==============================
// LISTA DE MEDICAÇÕES
// ==============================

app.get("/lista-medicacoes", (req, res) => {
  res.json([
    "Dipirona",
    "Paracetamol",
    "Ibuprofeno",
    "Amoxicilina",
    "Azitromicina",
    "Loratadina",
    "Omeprazol",
    "Buscopan",
    "Dramin",
    "Soro fisiológico"
  ]);
});

// ==============================
// CONSULTA MÉDICA
// ==============================

app.post("/consulta", (req, res) => {
  try {
    const db = readDB();

    const consulta = {
      id: Date.now(),
      paciente: req.body.paciente,
      diagnostico: req.body.diagnostico,
      medicacao: req.body.medicacao,
      obs: req.body.obs,
      createdAt: new Date().toISOString()
    };

    db.consultas.push(consulta);

    writeDB(db);

    res.json(consulta);

  } catch (erro) {
    console.error(
      "Erro ao salvar consulta:",
      erro
    );

    res.status(500).json({
      erro: "Erro ao salvar consulta."
    });
  }
});

// ==============================
// LISTAR CONSULTAS
// ==============================

app.get("/medicacoes", (req, res) => {
  try {
    const db = readDB();

    res.json(db.consultas);

  } catch (erro) {
    console.error(
      "Erro ao buscar consultas:",
      erro
    );

    res.status(500).json({
      erro: "Erro ao buscar consultas."
    });
  }
});

// ==============================
// TV - CHAMAR PACIENTE
// ==============================

app.post("/tv/chamar", (req, res) => {
  try {
    const db = readDB();

    const chamada = {
      id: Date.now().toString(),
      localTipo: req.body.localTipo,
      localNumero: req.body.localNumero,
      paciente: req.body.paciente,
      hora: new Date().toLocaleTimeString(
        "pt-BR",
        {
          hour: "2-digit",
          minute: "2-digit"
        }
      )
    };

    db.tv_chamada = chamada;

    if (!db.tv_historico) {
      db.tv_historico = [];
    }

    db.tv_historico.unshift(chamada);

    if (db.tv_historico.length > 5) {
      db.tv_historico.pop();
    }

    writeDB(db);

    res.json(chamada);

  } catch (erro) {
    console.error(
      "Erro ao chamar paciente:",
      erro
    );

    res.status(500).json({
      erro: "Erro ao realizar chamada."
    });
  }
});

// ==============================
// TV - CONSULTAR CHAMADA
// ==============================

app.get("/tv/chamada", (req, res) => {
  try {
    const db = readDB();

    res.json({
      chamada: db.tv_chamada || null,
      historico: db.tv_historico || []
    });

  } catch (erro) {
    console.error(
      "Erro ao consultar TV:",
      erro
    );

    res.status(500).json({
      erro: "Erro ao consultar chamada."
    });
  }
});

// ==============================
// EXPORTAR APP
// ==============================

module.exports = app;

