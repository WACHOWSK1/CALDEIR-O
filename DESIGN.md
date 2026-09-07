# CALDEIR-O — Design System & Arquitetura Visual
**Conceito:** Bancada Física de Alquimia & Cozinha Mágica (Tormenta 20)  
**Filosofia:** *A estética deve comunicar uma bancada de RPG viva e tátil, e não um dashboard com "skin" de fantasia.*

---

## 1. Por que este Design System existe?

A maioria das interfaces de crafting em jogos e aplicações web cai em uma de duas armadilhas:
1. **O visual genérico de SaaS/Dashboard**: cards flutuantes com cantos arredondados, sombras suaves em gradientes roxo/azul neon, fundo cinza plano e caixas de texto burocráticas.
2. **O "site medieval falso"**: colar texturas de pergaminho amarelado atrás de tabelas e botões web comuns com fontes góticas ilegíveis.

O **CALDEIR-O** foi projetado sob o princípio da **Fisicalidade Espacial**:
- A tela **é** uma bancada de boticário/mesa do chef.
- O **Caldeirão** de ferro fundido repousa como objeto volumétrico no centro da experiência.
- Os **ingredientes** estão guardados em prateleiras e gavetas de carvalho escuro.
- O **registro** é um grimório encadernado em couro com páginas envelhecidas.
- As ações de calor, mistura e reação utilizam controles mecânicos contextuais.

---

## 2. Paleta de Materiais & Tokens de Cor (`Palette Tokens`)

A interface estrutural é deliberadamente neutra e quente, simulando materiais nobres de oficina medieval. As cores vibrantes pertencem **exclusivamente aos conteúdos vivos**: líquidos do caldeirão, reagentes químicos, gemas de raridade e reações mágicas.

### A. Superfícies & Materiais de Fundo
| Token CSS | Valor HSL / Hex | Material Representado | Intenção de Design |
| :--- | :--- | :--- | :--- |
| `--surface-workshop` | `#12100e` (28° 14% 6%) | Madeira de Ébano / Oficina escura | Fundo imersivo, reduz fadiga visual na mesa de RPG noturna. |
| `--surface-bench` | `#1c1714` (24° 17% 9%) | Carvalho envelhecido encerado | A base da bancada onde os recipientes e instrumentos repousam. |
| `--surface-shelf` | `#241e19` (27° 19% 12%) | Prateleira de boticário / Gaveteiro | Superfície de organização de frascos e ervas. |
| `--surface-parchment`| `#e8dec8` (41° 42% 85%) | Pergaminho vegetal antigo | Superfície de alta legibilidade para o Grimório de receitas. |
| `--surface-parchment-ink`| `#29211a` (28° 23% 13%) | Tinta ferrogálica antiga | Texto sobre o pergaminho com contraste excelente (WCAG AAA). |

### B. Metais & Forja
| Token CSS | Valor | Material Representado | Intenção de Design |
| :--- | :--- | :--- | :--- |
| `--metal-iron` | `#2b2927` | Ferro fundido batido | Borda pesada e corpo do caldeirão, transmite peso e durabilidade. |
| `--metal-iron-highlight` | `#45413c` | Ferro desgastado na borda | Realismo tridimensional com reflexo discreto de luz ambiente. |
| `--metal-bronze` | `#b8863b` | Bronze envelhecido | Alças, aros do caldeirão, fivelas e seletores de ação física. |
| `--metal-bronze-dark` | `#7a5420` | Bronze oxidado | Chanfros e sulcos de metal. |

### C. Acentos Mágicos & Conteúdo Ativo
| Token CSS | Valor | Aplicação |
| :--- | :--- | :--- |
| `--magic-mana-glow` | `#38bdf8` | Reações de intelecto, vento, água pura e mana (T20). |
| `--magic-fire-glow` | `#f97316` | Brasas do fogareiro, reações inflamáveis e poções de fúria. |
| `--magic-nature-glow`| `#22c55e` | Ervas, venenos botânicos, curas naturais e elixires de regeneração. |
| `--magic-arcane-glow`| `#a855f7` | Essências de sombra, transmutação arcana e pós de ilusão. |
| `--magic-gold-glow` | `#eab308` | Descoberta inédita comemorativa e itens divinos. |

---

## 3. Escala Tipográfica (`Typography Tokens`)

A hierarquia é construída com duas famílias especializadas:
1. **Tipografia de Títulos & Fantasia (`Cinzel` / `MedievalSharp`)**: Usada com parcimônia para títulos do caldeirão, nome de receitas lendárias e cabeçalhos do grimório. Não possui serifa excessivamente floreada, mantendo nobreza visual.
2. **Tipografia de Interface & Legibilidade (`Inter` / Sans-serif neutra com suporte completo a diacríticos)**: Usada em todos os botões, etiquetas de ingredientes, números de quantidade, descrições mecânicas de regras de Tormenta 20 e tooltips. Garante legibilidade instantânea mesmo em iluminação fraca na mesa.

```css
/* Escala */
--font-family-display: 'Cinzel', 'MedievalSharp', Georgia, serif;
--font-family-ui: 'Inter', system-ui, -apple-system, sans-serif;

--text-xs: 0.75rem;    /* 12px - Rótulos de raridade, preços em T$ */
--text-sm: 0.875rem;   /* 14px - Descrições de itens, regras mecânicas */
--text-base: 1rem;     /* 16px - Nomes de ingredientes, botões de ação */
--text-lg: 1.125rem;   /* 18px - Subtítulos do grimório, seções */
--text-xl: 1.35rem;    /* 21.6px - Nome do prato/poção resultante */
--text-2xl: 1.75rem;   /* 28px - Título principal da bancada */
```

---

## 4. Sistema de Bordas, Relevos & Elevação (`Material Treatment`)

Em vez de sombras pretas difusas flutuantes (típicas de cards SaaS), a bancada utiliza chanfros de madeira esculpida e encaixes de ferro fundido:
- **Borda de Madeira Esculpida**: `border: 1px solid #3d3128; box-shadow: inset 0 1px 2px rgba(255,255,255,0.06), 0 4px 12px rgba(0,0,0,0.6);`
- **Borda de Ferro do Caldeirão**: `box-shadow: inset 0 4px 8px rgba(0,0,0,0.8), 0 8px 30px rgba(0,0,0,0.9);`
- **Etiqueta de Boticário (Tooltip)**: visual de papel artesanal com borda de fibra prensada e leve chanfro.

---

## 5. Sistema de Raridades de Ingredientes

Cada um dos 228 ingredientes possui um marcador visual tátil (pedra de toque/fita de boticário) que indica sua categoria e raridade sem poluir visualmente a bancada:

| Raridade | Cor do Selo | Efeito Visual | Frequência |
| :--- | :--- | :--- | :--- |
| **Comum** | `#78716c` (Cinza Pedra) | Sem brilho; rótulo sóbrio em madeira | ~60% dos ingredientes |
| **Incomum** | `#10b981` (Verde Esmeralda) | Leve reflexo esmeralda na borda | ~25% dos ingredientes |
| **Raro** | `#3b82f6` (Azul Safira) | Brilho cristalino pulsante sutil | ~12% dos ingredientes |
| **Lendário** | `#f59e0b` (Ouro Âmbar) | Runa arcana gravada e partículas de ouro | ~3% (Dragão, Quimera, Ancestrais) |

---

## 6. Estados de Interação & Reações do Caldeirão

O Caldeirão não é estático; ele reage organicamente a cada gesto do usuário:
1. **Estado Vazio / Em Espera (`idle`)**:
   - Líquido base translúcido em fogo baixo, com leves ondulações na superfície e uma discreta fumaça ambiente.
2. **Estado Drag-Over (`receiving`)**:
   - Quando um ingrediente válido é arrastado para a boca do caldeirão (área generosa de drop), a borda de bronze emite um calor acolhedor e a superfície do líquido abre pequenas ondas concêntricas.
3. **Estado Ingrediente Mergulhado (`splash`)**:
   - Ao soltar ou clicar para adicionar, um respingo líquido estilizado ocorre, pequenas bolhas emergem e a tonalidade do caldo muda gradualmente absorvendo a cor do reagente.
4. **Estado Fervura Ativa (`heating`)**:
   - Ao acionar a forja/fole, as brasas na base ganham intensidade, o borbulhar acelera e o vapor se torna mais denso.
5. **Estado Reação / Descoberta (`success`)**:
   - Se a combinação bate com uma das 160 receitas de alquimia ou 94 de gastronomia, o caldeirão se ilumina de dentro para fora, o item final surge levitando do vapor e a notificação solene de "NOVA DESCOBERTA" é selada no Grimório.
6. **Estado Mistura Instável (`unstable`)**:
   - Se a combinação não gerar um item cadastrado, a mistura chia, emite fumaça escura e cinzas de resíduo alquímico, permitindo esvaziar o caldeirão sem travar a sessão.

---

## 7. Tempos de Animação & Microinterações

- **Hover em Ingredientes**: `transform: translateY(-2px); transition: transform 140ms ease-out;` (sensação de levantar o frasco da prateleira).
- **Mergulho no Caldeirão**: `transition: all 280ms cubic-bezier(0.34, 1.56, 0.64, 1);` (tátil e responsivo).
- **Vapor & Partículas**: CSS Canvas / SVG otimizado em 60fps com baixo consumo de CPU/bateria para notebooks de mesa de RPG.
- **Suporte a `prefers-reduced-motion`**: Todas as animações de fervura e partículas contínuas são desativadas, substituídas por indicadores de estado estáticos de alta clareza.

---

## 8. Acessibilidade (WCAG 2.2 AA)

1. **Ação Dupla Obrigatória**: Qualquer ação realizável por drag-and-drop possui um botão alternativo acessível por clique ou teclado (Enter/Espaço).
2. **Contraste Mínimo**:
   - Texto em pergaminho: contraste 11.2:1 (excede padrão AAA).
   - Texto em madeira escura: contraste 8.4:1 (excede padrão AA).
3. **Foco Visível**: Navegação por teclado possui anel de foco em ouro forjado (`outline: 2px solid #eab308; outline-offset: 2px`).
4. **Alvos de Toque**: Todos os botões e frascos possuem área clicável mínima de 44x44px, facilitando o uso em telas touch ou trackpads imprecisos.
