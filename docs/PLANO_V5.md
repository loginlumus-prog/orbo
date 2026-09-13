# ORBO v5 — Plano: velocidade sentida, Galáxia 10×10×10, Singularidade dos 11 Arcontes, ícones, coleção, Égide e Jato, rankings

Data: 2026-09-13. Base: v4 publicado (docs/PLANO_V4.md). Regra de ouro mantida: tudo SOMA ao layout e à jogabilidade aprovados; os botões atuais ficam; nada de emoji; nenhum texto animado continuamente.

## 0. Pedido → entrega (checklist, nada fica de fora)

| # | Pedido | Como entra no v5 | Seção |
|---|---|---|---|
| 1 | Nas primeiras fases acelera ao acertar, mas pouco; cada fase acelera um pouco mais; sensação de ficar mais rápido pelas galáxias | Curva de velocidade global (base cresce por fase, sistema e galáxia), rampa dentro da fase e aceleração por sequência que crescem com o progresso; medidor de velocidade na ficha e aviso "VELOCIDADE +" | §1 |
| 2 | Cada fase da galáxia com a complexidade de uma galáxia de hoje, chefe no fim; 3–5 meses jogando muito até a Singularidade | Galáxia → 10 **Sistemas** → 10 **Fases** (a 10ª é o chefe do sistema). 1.000 fases, 100 chefes. Portal da galáxia e selo do sistema calibrados para ~4 meses | §2 |
| 3 | Ficha da galáxia: card, mecânica e chefe em cima; depois as fases; contratos embaixo | Nova ordem: hero → curiosidade → Portal (se fechado) → mecânica → chefe → prêmio/música → **sistemas** → **contratos no fim**; o mesmo padrão na ficha do sistema | §2.4 |
| 4 | Mais ícones, apresentação por ícones, informação ao passar o mouse / segurar | Chips de ícone com **dica** (hover no desktop, toque longo no celular) nas fichas, loja, poderes, missões e HUD | §3 |
| 5 | Ícones profissionais (poderes, missões, menu; o da galáxia "quebrado") | Conjunto próprio **ORBO Glyphs** (duotom: corpo translúcido + traço + brilho) desenhado para o tema espacial; placas com gradiente; revisão de todas as telas | §3 |
| 6 | Singularidade com 11 camadas e 11 guardiões | Tela da Singularidade: 11 camadas descendo até TON 618, um **Arconte** por camada | §4 |
| 7 | História escondida: praticar o bem, perdão, humildade, amar o próximo, servir, agradar a Deus | 11 parábolas cósmicas contadas em **Ecos** (fragmentos), sem nunca dizer a moral diretamente | §4.2 |
| 8 | Conversa com cada ancião (enviar mensagem), 3 caminhos: força, questionamento, entendimento | Diálogo em 3 trocas + **mensagem escrita** do jogador; o resultado define o caminho (oculto) e a dificuldade | §4.3 |
| 9 | Força = muito difícil (~5 % dos fortes, ≥ 1 ano); questionar = difícil; entendimento = mais fácil (6–8 meses) | Prova do Arconte com 3 perfis; força também exige poder (Núcleo e patente), entendimento não | §4.4 |
| 10 | Último Arconte: conversa complexa (reconhecer, praticar o bem, evoluir, servir) | 11º Arconte: conversa longa + **compor a resposta** com as Palavras recebidas nas camadas | §4.5 |
| 11 | Prêmio misterioso para quem zerar primeiro | Selo "Prêmio misterioso" na Singularidade; registro online do primeiro a zerar | §4.6 |
| 12 | +100 bolas com temas: planetas, estrela que não é bola, buraco negro lindo | **139 bolas** em 15 coleções; formas não redondas (estrela, buraco negro, rosquinha, OVNI) | §5 |
| 13 | Buraco negro = ~2 anos juntando moedas ou R$ 100 | TON 618: 1.500.000 moedas ou R$ 99,90 | §5.3 |
| 14 | Tudo comprável de graça (moedas) ou pago; pago só cosmético; mecânica só com dinheiro do jogo | Cosméticos: moedas **ou** gemas/IAP. Mecânica (poderes, Núcleo, Égide, Jato, continuar): **só moedas** (ou anúncio). Troca gema→moeda e moedas do VIP removidas | §9 |
| 15 | Temas bem diferentes | +12 temas com biomas novos que mudam fundo e estilo do arco | §5.4 |
| 16 | Mais poderes | +8 habilidades e +10 perks | §6 |
| 17 | Muitas missões e conquistas | +50 missões, +60 conquistas, álbum de coleções com prêmios | §7 |
| 18 | Ranking público de % de quem está zerando + ranking do infinito | Ranking **Jornada %** e **Infinito**, online (Supabase) com modo offline; nome do jogador | §8 |
| 19 | Mecânica tipo prancha do Subway Surfers: proteção em volta da bola, comprada em quantidade, com recarga | **Égide**: consumível; ativa uma bolha por 30 s que absorve um erro; recarga de 30 s; usa quantas tiver | §10.1 |
| 20 | Jato para ir mais rápido / mais longe, só no início | **Jato** e **Mega Jato**: usados só antes do 1º arco; atravessa 25 / 60 arcos voando | §10.2 |
| 21 | Preço que exige jogar bastante para ter 10 | Égide 1.800 moedas (10 ≈ 3 dias de quem joga muito); Jato 1.200; Mega 3.500 | §10.3 |
| 22 | Efeitos diferentes da proteção à venda, cada um com ícone | 10 visuais de Égide e 5 chamas de Jato na loja | §10.4 |
| 23 | Usar subagente para verificar | Simulação por script + revisão independente no fim | §12 |
| 24 | Pode usar o Magnific | Só onde agrega (retratos dos Arcontes, após teste de estilo); ícones de interface são vetoriais próprios | §3.4 |

## 1. Velocidade sentida

Velocidade dos arcos numa fase da Galáxia (g = progresso global 0..1 nas 1.000 fases):

- **Base**: `v0 = 245 + 575·g^1.15` px/s (fase 1-1-1 ≈ 245; última ≈ 820).
- **Rampa dentro da fase**: do primeiro ao último arco sobe `6 % + 22 %·g` (6 % nas primeiras, 28 % no fim).
- **Sequência (fluxo)**: acertos seguidos somam até `5 % + 15 %·g` (5 % no começo: "acelera, mas nem tanto"; 20 % no fim). Errar volta ao normal.
- **Degrau por sistema**: sistema novo abre com aviso "VELOCIDADE +"; fichas mostram a velocidade num medidor.
- **Tempo entre arcos** acompanha a velocidade para o espaçamento continuar justo.
- Infinito: a aceleração por sequência também cresce fase a fase (5 % → 20 %).

## 2. Galáxia 10 × 10 × 10

### 2.1 Estrutura
- 10 galáxias (as reais do v4) → **10 sistemas** com as letras gregas usadas nas estrelas reais (Alfa … Capa; "Sistema Gama · M51") → **10 fases** cada; a 10ª é o **chefe do sistema**.
- O chefe do sistema 10 é o **chefe da galáxia** (os 10 chefes do v4, com mais ondas).
- Chefes de sistema combinam a mecânica da galáxia com uma secundária rotativa (100 chefes).
- Id da fase: `g-s-f` (ex.: `3-7-10`). Tudo gerado por função determinística (`HR.Campaign.gen`).

### 2.2 Portas
- **Fase**: a anterior concluída.
- **Sistema**: chefe do sistema anterior + estrelas no sistema anterior (16/30 → 22/30).
- **Galáxia (Portal)**: chefe da galáxia anterior + estrelas na galáxia anterior + patente + Núcleo + 5 de 8 contratos.
- **Singularidade**: chefe de Andrômeda + Portal próprio.

### 2.3 Calibração
Joga muito ≈ 80 partidas/dia; casual ≈ 20. XP por partida limitado; **bônus diário**: as 10 primeiras partidas do dia dão XP ×2 (aproxima o casual). Metas: Singularidade em ~4 meses (muito) e ~11 meses (casual); entendimento completo ~6–8 meses; força ≥ 12 meses. Tabela final em "Estado v5".

### 2.4 Fichas (ordem pedida)
- **Galáxia**: hero animado → curiosidade → Portal (se fechado) → mecânica → chefe da galáxia → prêmio/música → **Sistemas** (caminho de 10 nós) → **Contratos** (8) no fim.
- **Sistema**: hero do sistema → chefe do sistema → selo de estrelas → **Fases** (caminho de 10 nós) → continuar.

### 2.5 Migração do save
As 100 fases antigas (`r-f`) viram as fases dos sistemas da galáxia 1 (`1-r-f`), preservando estrelas; prêmios já recebidos ficam.

## 3. Ícones e dicas

### 3.1 ORBO Glyphs
- Grade 24, traço 1,8, cantos redondos, **duotom** (corpo `currentColor` a 22 % + contorno + ponto de brilho), motivo espacial.
- ~150 ícones: menu, poderes, perks, itens, eventos, chefes, contratos, missões, conquistas, coleções, Égide, Jato, Arcontes, sistema.
- `HR.icon(nome)` mantém a API; nomes antigos continuam válidos.

### 3.2 Placas
`HR.plate(nome, cor)`: ícone numa placa com gradiente, borda interna e brilho (menu, poderes, missões, conquistas, loja).

### 3.3 Dicas
Elemento com `data-tip` (título) e `data-tip-d` (descrição) mostra dica: hover/foco no desktop, toque longo (350 ms) no celular.

### 3.4 Magnific
Retratos holográficos dos 11 Arcontes, se o teste de estilo combinar com o jogo; senão, sigilos animados em canvas.

## 4. Singularidade: as 11 camadas

### 4.1 Cada camada
1. **Passagem**: 5 fases de fim de jogo com **Ecos** (item raro) que revelam fragmentos da história.
2. **Conversa com o Arconte**.
3. **Prova do Arconte**: chefe longo com dificuldade pelo caminho.
4. Ao passar: **Palavra** (só no entendimento), bola do Arconte, prêmios.

### 4.2 História (subentendida)
1 O Espelho (humildade) · 2 A Semente (gratidão) · 3 A Dívida (perdão) · 4 O Viajante Caído (amor ao próximo) · 5 A Voz (verdade) · 6 A Estrela que Esperou (paciência) · 7 O Farol (misericórdia) · 8 As Mãos (servir) · 9 O Peso (entrega) · 10 A Ponte Invisível (fé) · 11 A Luz de Onde Viemos (graça: reconhecer, servir, amar).

### 4.3 Conversa
- 3 trocas: o Arconte fala, o jogador escolhe 1 de 3 respostas (todas soam razoáveis; quem leu os Ecos reconhece a do entendimento).
- 4º passo: **mensagem escrita**. Leitura por palavras-chave tolerante a acento e erro, PT/EN/ES.
- Pontuação oculta → **Entendimento**, **Questionamento** ou **Força**. Fica gravado.
- **Reconciliação**: após 7 dias ou 25 derrotas, o Arconte aceita conversar de novo.

### 4.4 Prova do Arconte
| Caminho | Ondas | Velocidade | Arcos | Precisa passar | Graça | Exigência |
|---|---|---|---|---|---|---|
| Entendimento | 5 | ×1,00 | ×1,00 | 60 % | 1 escudo por onda | nenhuma |
| Questionamento | 6 | ×1,12 | ×0,92 | 72 % | — | Núcleo ≥ 20 |
| Força | 7 | ×1,28 | ×0,80 | 85 % | Égide desativada | Núcleo 30 e patente alta |

### 4.5 11º Arconte
5 trocas + composição da resposta com as Palavras reunidas.

### 4.6 Final e prêmio
Epílogo, bola "Luz de Onde Viemos", título conforme o caminho, selo do **prêmio misterioso** (primeiro do mundo, online).

## 5. Coleção

### 5.1 Bolas (139, 15 coleções)
Clássicas (26) · Sistema Solar (13) · Estrelas (10, forma de estrela) · Nebulosas (10) · Buracos Negros (4) · Gemas (8) · Esportes (6) · Criaturas (8) · Elementos (8) · Tecnologia (8, com OVNI) · Símbolos (6) · Doces (6, com rosquinha) · Temporadas (+5) · Galáxias (10, prêmio dos chefes) · Arcontes (11, prêmio das camadas).

### 5.2 Loja
Filtro por coleção (chips com ícone), prévias animadas só quando visíveis, álbum com prêmio por coleção completa.

### 5.3 Preços
Moedas pela raridade (comum 400–900; rara 1,5–4 mil; épica 8–20 mil; lendária 40–120 mil; mítica 250–600 mil); gemas como alternativa paga; TON 618: 1.500.000 moedas ou R$ 99,90.

### 5.4 Temas
+12 temas com biomas novos (Synthwave, Marte, Sakura, Nevasca, Cosmos, Matriz, Oceano Profundo, Caverna de Cristal, Aurora Boreal, Crepúsculo, Tempestade Solar, Vazio).

## 6. Poderes
Habilidades novas: Buraco Negro, Prisma, Fênix, Febre do Ouro, Micro, Cometa, Supernova, Cronos. +10 perks. Tudo com moedas.

## 7. Missões e conquistas
+50 modelos de missão e +60 conquistas (sistemas, chefes, Ecos, Égide, Jato, coleções, poderes, Singularidade), títulos novos.

## 8. Rankings
- **Jornada %**: 60 % fases, 15 % estrelas, 25 % Arcontes (duas casas decimais).
- **Infinito**: melhor pontuação.
- `HR.Online` com adaptador Supabase; sem backend, ranking de demonstração. SQL em `docs/BACKEND_RANKING.md`. Criar o projeto depende de confirmação (custo).

## 9. Economia sem pagar para ganhar
- Poderes, melhorias, Núcleo, Égide, Jato e continuar: **moedas** (continuar também por anúncio).
- Gemas só compram cosméticos; troca gema→moeda removida; VIP dá gemas e remove anúncios.

## 10. Égide e Jato

### 10.1 Égide
Botão no HUD com contador. Ativa uma bolha por 30 s; o primeiro erro a quebra e a bola sobrevive; acabando o tempo ela some. Recarga de 30 s. Pisca nos 3 s finais.

### 10.2 Jato
Antes do 1º arco aparecem Jato / Mega Jato. A bola voa atravessando 25 / 60 arcos (invencível, pega moedas, sem PERFEITO). Na Galáxia só em fases comuns.

### 10.3 Preços
Égide 1.800 moedas; Jato 1.200; Mega Jato 3.500. Também em prêmios semanais.

### 10.4 Visuais
Égides: Cristal, Aurora, Brasa, Vazio, Solar, Runas, Pétalas, Neve, Colmeia, Relâmpago. Jatos: Azul, Solar, Plasma, Esmeralda, Arco-íris.

## 11. Ordem de execução
1. Ícones, placas e dicas.
2. Campanha 10×10×10, velocidade, portas, migração, fichas.
3. Égide e Jato.
4. Poderes, perks e economia.
5. Bolas, temas, loja por coleção.
6. Singularidade.
7. Rankings online.
8. Missões e conquistas.
9. Verificação, docs, publicação.

## 12. Verificação
Simulação por script (velocidade, portas, Égide/Jato, chefes de sistema, provas nos 3 caminhos, conversa), capturas em 390×700, 420×860 e desktop, console limpo, revisão independente por subagente.

## 13. Estado v5 (2026-09-13)

Implementado e verificado no navegador (console limpo):

| Pedido | Entrega | Onde ajustar |
|---|---|---|
| Velocidade sentida por fase | `v0`, rampa e fluxo crescem por fase e por galáxia; teto = 1,3× `maxSpeed` (1,9× com Jato/Cometa/Dobra) | `CONFIG.SPEED`, `speedAt` em `js/game.js` |
| Galáxia com a complexidade de antes em cada fase | 10 galáxias × 10 sistemas × 10 fases; fase 10 de cada sistema é chefe; sistema 10 traz o chefe da galáxia | `js/campaign.js` |
| Ficha da galáxia na ordem pedida | galáxia → mecânica → chefe → fases (sistemas) → contratos | `js/ui-galaxy.js` |
| Ícones profissionais com dica | ORBO Glyphs (menu, poderes, missões, galáxia, chefes, equipamento, Singularidade) + dicas por hover/toque longo | `js/icons.js`, `js/tips.js` |
| Singularidade de 11 Arcontes | passagem de 5 fases com Ecos, conversa com mensagem escrita, caminhos Força/Questionamento/Entendimento, conversa final composta, prêmio ao primeiro | `js/singularity.js`, `HR.SG` |
| Tempo de jogo | Singularidade ≈ 4 meses pesados; Entendimento ≈ 6–8 meses; Força ≈ 1 ano (portas por rank e Núcleo) | `PROGRESSION.regionRank/regionCore`, `HR.SG.paths` |
| Poderes e bolas | 17 habilidades, 37 perks, 138 bolas em 15 coleções, TON 618 por 1,5 mi moedas ou R$ 99,90 | `js/perks.js`, `js/skins.js` |
| Pago só cosmético | mecânica só com moedas; cosméticos com moedas ou gemas; troca gema→moeda removida | `HR.SKIN_PRICE`, `js/gear.js` |
| Temas, missões, conquistas | 23 temas (12 novos com biomas), 125 missões, 151 conquistas, títulos | `CONFIG.THEMES`, `js/content-v5.js` |
| Rankings | Jornada % e Infinito (Supabase anônimo), demonstração enquanto `BACKEND` estiver vazio | `js/online.js`, `docs/BACKEND_RANKING.md` |
| Égide | bolha consumível, 30 s, recarga 30 s, 1.800 moedas (5 por 8.500), 10 visuais | `HR.GEAR` |
| Jato | só antes do 1º arco: Jato 25 arcos, Mega Jato 60 arcos, 5 visuais | `HR.GEAR` |

Pendências fora do código: criar o projeto Supabase do ranking (tem custo e precisa de confirmação) e definir o prêmio real do primeiro a zerar.

Revisão independente (subagente) — corrigido e verificado: missões só sorteiam o que dá para cumprir (habilidade comprada, Singularidade aberta, Égide/Jato em estoque; metas semanais grandes não entram na diária nem triplicam); saves v4 recebem a bola da galáxia 1 e a Égide dos chefes de sistema já vencidos (`HR.Campaign.backfill`); Crono/Cometa/Jato não mudam a distância entre arcos; Jato bloqueado em todas as camadas da Singularidade; falha de refresh do login do ranking não cria jogador duplicado. Mantido de propósito: erro salvo pela Égide conta como erro para a 3ª estrela (igual ao escudo).
