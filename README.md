# 🎮 Guerra Mundial Game // Cyber Strike 2D

Motor e protótipo de jogo de tiro 2D estilo retro-arcade cyberpunk, construído com **HTML5 Canvas**, **Vanilla JavaScript (ES6+)** e **CSS Moderno**.

---

## ✨ Funcionalidades

- **Sincronia 1:1 de Movimentos**:
  - Caminhada (ndando.gif) calibrada exatamente com a cadência de passada de 1,44s (130 px/s).
  - Corrida dinâmica (correndo.gif) com suporte a Shift (250 px/s).
  - Transição instantânea para parado.gif no momento em que as teclas são soltas.
  - Física de gravidade e salto integrado com pulo.gif.
  - Disparo animado com tirando.gif.
- **Câmera Infinita e Chão com Rolagem em Perspectiva**:
  - Rolagem contínua do chão em grade (cameraX) eliminando o efeito de 'andar parado'.
  - Efeito paralaxe na silhueta da cidade cyberpunk ao fundo.
- **Efeitos Visuais**:
  - Partículas de poeira de atrito nos pés a cada passada no chão.
  - Sombra dinâmica elíptica sob o personagem.
  - Partículas de néon ambientais.
  - Filtro retrô CRT Scanlines com botão de alternância.
- **HUD Interativo & Terminal**:
  - Medidor de FPS e DeltaTime em tempo real.
  - Monitor de coordenadas globais (X/Y) e velocidade.
  - Teclado de atalhos e botões para teste de animações (1 a 5).

---

## 🕹️ Controles

| Ação | Tecla / Comando |
| :--- | :--- |
| **Mover Esquerda / Direita** | A / D ou Setas ← / → |
| **Correr** | Segurar Shift + Movimento |
| **Pular** | Espaço ou W / ↑ |
| **Atirar** | F, X ou Clique do Mouse |
| **Testar Animações** | Teclas 1 a 5 ou botões no painel inferior |
| **Scanlines CRT** | Botão CRT SCANLINES no painel |
| **Visualizar Hitbox** | Botão HITBOX DEBUG no painel |

---

## 🚀 Como Executar Localmente

Como o projeto utiliza módulos ES6 nativos, inicialize com qualquer servidor HTTP local:

### Opção 1: Via Python
`ash
# Dentro da pasta do projeto:
python -m http.server 8000
`
Acesse no navegador: http://localhost:8000

### Opção 2: Via VS Code
- Abra a pasta no VS Code.
- Clique com o botão direito em index.html e selecione **Open with Live Server**.

---

## 📁 Estrutura do Projeto

`	ext
├── index.html        # Estrutura do gabinete arcade e viewport
├── style.css         # Design system, tokens cyber arcade e CRT
├── README.md         # Documentação
├── .gitignore        # Arquivos ignorados pelo Git
├── gif/              # Sprites animados transparentes do personagem
│   ├── parado.gif
│   ├── andando.gif
│   ├── correndo.gif
│   ├── pulo.gif
│   ├── atirando.gif
│   ├── atirando para baixo.gif
│   └── atirando correndo.gif
└── src/
    ├── player.js     # Classe Player, física, inércia e renderização dual-layer
    └── game.js       # Game loop determinístico, câmera e partículas
`
