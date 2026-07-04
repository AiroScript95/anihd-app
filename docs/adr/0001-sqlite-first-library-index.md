# ADR 0001: Indice da biblioteca em SQLite

## Status

Proposto

## Contexto

O AniHD ja e util, mas o servidor faz trabalho demais diretamente dentro das
rotas HTTP. Hoje varias rotas leem a pasta de videos, interpretam `info.json`,
calculam dados derivados, verificam thumbnails e montam respostas da API durante
o proprio request. O processo Electron tambem le e escreve alguns dos mesmos
arquivos locais diretamente.

Esse desenho e simples para comecar, mas cria limites previsiveis:

- requests ficam mais lentos conforme a biblioteca cresce;
- os mesmos scans de filesystem sao repetidos em varias rotas;
- invalidacao de cache fica ampla e manual;
- arquivos JSON viram um banco fraco para dados mutaveis, como pedidos;
- handlers de rota misturam HTTP, IO de disco, regra de negocio e resposta;
- trabalhos demorados, como thumbnails, ficam acoplados a leituras de usuario;
- features futuras, como progresso assistido, favoritos, revisao de pedidos,
  busca melhor e historico, nao tem um modelo de persistencia estavel.

O projeto ja inclui dependencias de SQLite e um arquivo de banco local. Portanto,
uma arquitetura baseada em banco encaixa na stack atual sem exigir cluster,
servico externo, Docker, cloud ou uma reescrita pesada.

## Decisao

Adotar uma arquitetura de **monolito modular SQLite-first**.

A pasta de videos continua sendo a fonte da verdade para os arquivos de midia,
mas o app passa a manter uma representacao indexada da biblioteca no SQLite. As
leituras HTTP consultam SQLite. A varredura do filesystem acontece em um scanner
explicito, fora do caminho quente de cada request.

Isso mantem o AniHD como app local/LAN, mas da uma estrutura interna mais seria:

- **Routes** recebem HTTP, validam entrada e chamam services.
- **Services** guardam regras de negocio e coordenam operacoes.
- **Repositories** sao a unica camada que le e escreve SQLite.
- **Jobs** executam trabalho demorado, como scan da biblioteca e thumbnails.
- **Adapters** isolam filesystem, FFmpeg, processamento de imagem e IPC Electron.

Isso nao deve virar microservices. SQLite com fronteiras internas claras e o
nivel certo de engenharia para um app de midia local.

## Modelo de dados alvo

O primeiro schema deve modelar o produto atual, nao um produto imaginario.

Tabelas principais:

- `settings`: pasta da biblioteca, titulo do app e configuracoes locais.
- `animes`: um registro por titulo principal ou titulo logico.
- `seasons`: temporadas ou agrupamentos pertencentes a um anime.
- `episodes`: arquivos reproduziveis com path relativo, nome, tamanho, mtime,
  duracao quando existir e data de adicao.
- `assets`: capas, imagens de temporada, banners e thumbnails geradas.
- `requests`: pedidos de animes enviados por usuarios e status de revisao.
- `scan_runs`: estado do scanner, inicio/fim, contadores e erros.

Indices importantes:

- nome normalizado de anime para busca e deteccao de duplicados;
- `relative_path` de episodio como identidade unica;
- `mtime` e `size` para detectar alteracoes incrementais;
- data de adicao para `/api/releases`;
- status de pedido para fluxo administrativo.

## Fluxo de execucao

Inicializacao:

1. Electron inicia o servidor como faz hoje.
2. O servidor abre o SQLite e roda migrations.
3. Se houver pasta configurada, o servidor disponibiliza o ultimo indice salvo
   imediatamente.
4. Um scan pode rodar em background para atualizar o indice.

Scan da biblioteca:

1. Percorrer a pasta configurada.
2. Interpretar estrutura de pastas e `info.json`.
3. Fazer upsert de animes, temporadas, episodios e assets.
4. Remover ou marcar como ausentes os itens que sumiram do disco.
5. Enfileirar thumbnails apenas para episodios novos ou alterados.
6. Persistir estado do scan em `scan_runs`.
7. Invalidar apenas caches afetados.

Leituras da API:

1. `/videos`, `/api/anime/*` e `/api/releases` consultam repositories.
2. Services transformam linhas do banco no formato atual da API.
3. O frontend continua funcionando enquanto os internos melhoram.

Dados mutaveis:

1. Pedidos saem de `database/database.json` e entram na tabela `requests`.
2. Dados JSON existentes sao importados uma vez durante migration ou startup.
3. Electron deve chamar APIs/services de alto nivel em vez de editar JSON
   diretamente.

## Plano incremental

Essa arquitetura deve entrar em PRs pequenos.

### PR 1: Registro arquitetural

Adicionar esta ADR e alinhar a direcao antes de mudar comportamento.

### PR 2: Fundacao de banco

Adicionar runner de migrations e helpers de repository. Criar schema com testes
que provam que migrations podem rodar mais de uma vez.

### PR 3: Pedidos em SQLite

Mover pedidos de anime do JSON para SQLite. Manter fallback de importacao unica
para `database/database.json`. Preservar o comportamento atual de `/get-pedidos`
e `/feedback`.

### PR 4: Scanner da biblioteca

Adicionar service de scan que indexa a pasta configurada no SQLite. Incluir um
comando manual como `npm --prefix server run scan` e um endpoint de status.

### PR 5: APIs lendo do SQLite

Alterar `/videos`, `/api/anime/*` e `/api/releases` para ler do banco indexado,
preservando os formatos de resposta atuais.

### PR 6: Jobs e thumbnails

Transformar a geracao de thumbnails em uma fila explicita com estado persistido
para pendente, rodando, concluido e falhou.

## Estrategia de testes

Usar `node:test` primeiro porque ja esta disponivel e mantem o projeto acessivel.

Cobertura obrigatoria:

- migrations criam o schema e rodam mais de uma vez;
- repositories inserem, atualizam, listam e removem entidades principais;
- scanner trata biblioteca vazia, episodios na raiz, pastas de temporada,
  arquivos alterados e arquivos removidos;
- migracao de pedidos importa JSON sem duplicar registros;
- payloads atuais das APIs continuam compativeis enquanto os internos mudam.

Os testes devem usar pastas temporarias e bancos SQLite temporarios. Eles nao
devem depender de uma biblioteca real, `.env` local ou banco commitado.

## Como introduzir sem assustar o mantenedor

Esta proposta deve ser apresentada como evolucao, nao como critica pessoal nem
reescrita total. O tom recomendado no PR:

- reconhecer que a arquitetura atual foi boa para tirar o app do papel;
- explicar que os problemas aparecem naturalmente quando o app cresce;
- propor a mudanca em etapas pequenas e reversiveis;
- manter URLs, telas e comportamento atuais durante a migracao;
- fazer cada PR ter testes e um objetivo claro.

O primeiro PR deve ser apenas esta ADR. O segundo PR deve ser pequeno o bastante
para revisar em uma sessao: migrations + schema + testes. So depois disso vale
migrar features reais.

## Consequencias

Beneficios:

- respostas de API mais rapidas em bibliotecas grandes;
- menos scans repetidos no filesystem;
- fronteiras mais claras entre HTTP, dominio, persistencia e background jobs;
- dados mutaveis mais seguros do que escrita direta em JSON;
- base boa para busca, progresso assistido, favoritos, revisao administrativa e
  observabilidade.

Custos:

- mais estrutura do que o estilo atual de scripts simples;
- migrations e estado de scanner precisam ser mantidos com cuidado;
- a implementacao inicial exige disciplina para nao virar um rewrite gigante.

A troca vale a pena porque o app ja esta passando do ponto em que
filesystem-por-request e JSON-como-banco tornam cada feature nova mais dificil.

## Nao objetivos

- Nao introduzir microservices.
- Nao exigir Postgres, Redis, Docker ou dependencia de cloud.
- Nao trocar o frontend como parte desta arquitetura.
- Nao quebrar URLs ou formatos atuais de resposta durante a migracao.
- Nao remover `info.json`; ele deve continuar sendo suportado pela conveniencia
  do usuario.
