# ORBO — Os quatro finais

Texto: `js/story-g10.js` (cenas `end_U`, `end_Q`, `end_F`, `end_M`).
Motor: `HR.Story.ending()` em `js/story.js`; a chamada fica em `js/ui-story.js`,
no gancho de `onLevelEnd`, depois da cena da porta.

---

## A regra

Nenhum final é o certo. Cada um custa uma coisa diferente, e o jogo nunca diz qual
é melhor. A porta **fica aberta**: quem voltar à fase 10-10-10 responde de novo e vê
outro. É a única cena do jogo que pode ser revivida.

### Como o final é escolhido

Em ordem, a primeira regra que valer:

1. **As três bandeiras secretas.** Se a pessoa tem `ninho`, `contempla` e `costura`
   ao mesmo tempo, o final é **Muitas Mãos**, qualquer que seja a resposta.
2. **A resposta dada na porta.** U, Q ou F, a última que ela deu ali.
3. **O eixo que somou mais no jogo inteiro** (`dominant()`), para quem pulou a
   pergunta da porta. Empate ou zero cai em **A Pergunta** — é o final de quem
   atravessou tudo sem responder nada, e faz sentido que seja o da dúvida.

As três bandeiras não são conquistas de combate: são as três vezes em que a pessoa
**perdeu tempo de propósito com alguém**. Ficar no Ninho em vez de vencer, parar
quinze segundos para olhar na Via Láctea, seguir o fio da Costura até o fim. Quem faz
as três chega à porta acompanhada — e por isso a porta é outra.

---

## A Passagem (U)

**Gatilho:** eixo U, ou "Fico no meio. Seguro com eles." na porta.

Ela entra no vão e abre os braços, uma mão de cada lado. Eles soltam — pela primeira
vez desde o dia em que ela chegou. Nenhum dos dois responde; um se encosta nela de um
lado, o outro do outro.

**Imagem final:** a silhueta dela entre as duas luzes, tocando as duas.

**O preço:** ela nunca mais sai. É o único lugar do universo onde ela toca os dois, e
para ficar nele ela vira a fronteira que os mantém separados.

**O que fica:** o Eclipse da galáxia 8 era isto o tempo todo — alguém que ficou no meio
de duas luzes que se querem, até virar lugar. Quem prestou atenção nele já viu este
final antes de chegar nele.

---

## A Pergunta (Q)

**Gatilho:** eixo Q, ou "Pergunto se eles quiseram." na porta. Também o final de quem
pulou tudo.

Ela pergunta. O silêncio é do tamanho de tudo. Depois, na beira, a letra leve da mãe
aparece de novo — e pela primeira vez **termina uma frase**: *quisemos*.

**Imagem final:** a palavra inteira na borda, sem tremer.

**O preço:** nada se resolve. O rasgo continua aberto, eles continuam segurando, ela
continua dentro. Só uma coisa muda: ela larga o peso que carregava sem saber o nome.

**O que fica:** é o único final que responde a pergunta do jogo inteiro. A mentira do
Eco era "foi você"; a resposta não é "não fui" — é "quisemos".

---

## A Porta Quebrada (F)

**Gatilho:** eixo F, ou "Junto os dois. Agora." na porta.

Ela empurra as duas beiras uma contra a outra. O espaço dobra: dez galáxias, uma dentro
da outra, até caber em nada.

**Imagem final:** escuro morno, sem espaço. Um só.

**O preço:** tudo. Inclusive ela — ela só existia havendo dois. O Eco tem a última fala,
e é a única vez no jogo em que ele está certo por acidente.

**O que fica:** a última linha. No escuro sem espaço, os dois voltam a ser um, e lembram
de uma coisa pequena, com nome pequeno. Não é um final feliz, mas não é vazio.

---

## Muitas Mãos (as três bandeiras)

**Gatilho:** `ninho` + `contempla` + `costura`, qualquer resposta na porta.

Ela não entra sozinha. O Cardume vira fila do chão até a porta. Íris segura de um lado.
Poeira encosta na beira e não apaga. Lá atrás, o anel que Casco segurou continua aberto.
As duas mãos soltam — e o vão não fecha, porque está cheio de mãos.

**Imagem final:** o vão aberto, cheio de gente segurando, e os dois olhando. Pela primeira
vez, eles olham.

**O preço:** nenhum. É por isso que é o mais difícil: exige três coisas que o jogo nunca
pede, nunca aponta e nunca recompensa na hora.

**O que fica:** a última fala é dela, e são duas palavras: "Vem. Olha."

---

## Conquistas

| id | categoria | como se ganha | gemas |
|---|---|---|---|
| `end_u` | galáxia | ver A Passagem | 100 |
| `end_q` | galáxia | ver A Pergunta | 100 |
| `end_f` | galáxia | ver A Porta Quebrada | 100 |
| `end_m` | galáxia | ver Muitas Mãos | 100 |
| `end_all` | secreta | ver os quatro | 300 |

`HR.Story.endingsSeen()` devolve a lista dos que já apareceram; a estatística sai de um
embrulho de `HR.Achievements.stats5`, no fim de `js/story-g10.js`.
