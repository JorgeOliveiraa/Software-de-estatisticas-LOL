# LoL Stats

App Android pessoal para registrar partidas de League of Legends e acompanhar o desempenho com cada campeão. Os dados ficam salvos no próprio celular (SQLite), sem servidor e sem nuvem, e o app funciona offline.

## Recursos

- Lista com todos os campeões em ordem alfabética, com retratos oficiais (Data Dragon) e busca.
- Favoritos no topo da lista.
- Tela de cada campeão com:
  - partidas, vitórias, derrotas e taxa de vitória;
  - KDA médio, totais e médias de kills, mortes e assistências;
  - nota de desempenho (S, A, B, C, D ou ND), calculada a partir de KDA, taxa de vitória e consistência;
  - detalhamento por modo de jogo (Solo/Duo, Flex, Normal e ARAM);
  - histórico de partidas.
- Cadastro de partidas com resultado, kills, mortes, assistências, rota, modo de jogo, data e observações.
- Edição e exclusão de partidas, com confirmação antes de excluir.
- Todas as estatísticas são recalculadas automaticamente a partir do histórico. Nenhum total fica salvo no banco.
- Cache da lista de campeões e das imagens para usar sem internet.

## Nota do campeão

A nota combina três fatores:

| Fator | Peso |
|---|---|
| KDA médio | 35% |
| Taxa de vitória | 45% |
| Consistência entre as partidas | 20% |

Com poucas partidas a nota é puxada para o meio, porque poucos jogos não provam nada. Ela fica mais confiável a partir de 10 partidas. As faixas são: S (85+), A (70+), B (55+), C (40+) e D (abaixo disso). ND significa que ainda não há partidas com o campeão. O cálculo está em `src/services/grade.ts`.

## Tecnologias

- [Expo](https://expo.dev) (SDK 58) e React Native
- TypeScript
- [Expo Router](https://docs.expo.dev/router/introduction/) para navegação
- [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/) para o banco local
- [Data Dragon](https://developer.riotgames.com/docs/lol#data-dragon) (Riot Games) para dados e imagens dos campeões

## Estrutura

```
src/
  app/          telas (início, campeão, formulário de partida)
  components/   componentes visuais
  constants/    opções de rota e modo de jogo
  db/           banco de dados SQLite
  hooks/        carregamento de dados
  services/     cálculos de estatísticas, nota e datas
  theme/        cores
```

## Como rodar

Pré-requisitos: Node.js e o app **Expo Go** no celular (a versão da loja precisa suportar o SDK usado pelo projeto).

```bash
npm install
npx expo start
```

Escaneie o QR code com o Expo Go. O celular e o computador precisam estar na mesma rede Wi-Fi. Se houver problemas de conexão, use `npx expo start --tunnel`.

## Gerar o APK

O build é feito na nuvem com o [EAS Build](https://docs.expo.dev/build/introduction/). O arquivo `eas.json` já tem um perfil `preview` que gera um APK instalável:

```bash
npx eas-cli@latest login
npx eas-cli@latest build -p android --profile preview
```

## Aviso

LoL Stats é um projeto pessoal e não é endorsado nem patrocinado pela Riot Games. League of Legends e Riot Games são marcas registradas da Riot Games, Inc.
