# Contribuir para o AniHD

## Como rodar o projeto

1. `git clone` do repositório
2. `npm install`
3. `npm start` (ou o comando que uses para dev)

## Regras

- Não commitar direto na `main` — cria uma branch (`feature/nome`, `fix/nome`)
- Abre um Pull Request para revisão antes do merge
- Explica no PR o que mudou e porquê

## Estilo de código

- Segue o padrão já usado no projeto (nomes de funções em português, etc.)
- Comenta trechos complexos

## Direção arquitetural sugerida

O AniHD começou com uma arquitetura simples, o que é normal e útil para tirar um projeto do papel. À medida que o app cresce, algumas decisões começam a pesar: rotas que fazem scan da pasta de vídeos durante o request, dados mutáveis em JSON, cache difícil de invalidar e regras de negócio misturadas com HTTP, filesystem e UI.

A evolução recomendada é transformar o servidor em um **monolito modular com SQLite como índice principal da biblioteca**. Não é uma proposta de reescrita completa nem de microservices. A ideia é manter Electron, Express e a interface atual, mas organizar melhor os internos para ganhar performance, previsibilidade e espaço para novas features.

### Princípios

- A pasta de vídeos continua sendo a fonte da verdade para os arquivos de mídia.
- O SQLite guarda um índice consultável da biblioteca: animes, temporadas, episódios, assets, pedidos e estado de scans.
- Requests HTTP não devem varrer a biblioteca inteira. Eles devem consultar o banco e responder rápido.
- Trabalho demorado, como scan de biblioteca e thumbnails, deve rodar em jobs explícitos.
- O Electron deve chamar APIs ou serviços de alto nível, evitando editar arquivos internos diretamente.
- Cada mudança grande deve entrar em PRs pequenos, testados e reversíveis.

### Organização recomendada do servidor

- `routes/`: recebe HTTP, valida entrada e chama services.
- `services/`: contém regras de negócio e coordena operações.
- `repositories/`: única camada que lê e escreve no SQLite.
- `jobs/`: executa tarefas demoradas, como scan da biblioteca e geração de thumbnails.
- `adapters/`: isola integrações com filesystem, FFmpeg, Sharp e IPC do Electron.
- `lib/`: utilidades pequenas, puras e reaproveitáveis.

### Modelo de dados inicial

O primeiro schema deve modelar o produto atual, sem tentar prever todas as features futuras:

- `settings`: pasta da biblioteca, título do app e configurações locais.
- `animes`: títulos principais.
- `seasons`: temporadas ou agrupamentos de um anime.
- `episodes`: arquivos reproduzíveis, com path relativo, nome, tamanho, `mtime`, duração quando existir e data de adição.
- `assets`: capas, imagens de temporada, banners e thumbnails.
- `requests`: pedidos de animes e status de revisão.
- `scan_runs`: histórico e estado dos scans da biblioteca.

Índices importantes:

- nome normalizado de anime para busca e detecção de duplicados;
- `relative_path` de episódio como identidade única;
- `mtime` e `size` para detectar arquivos alterados;
- data de adição para `/api/releases`;
- status de pedido para fluxos administrativos.

### Plano incremental

1. **Fundação do banco**: adicionar migrations, helpers de repository e testes de idempotência.
2. **Pedidos em SQLite**: migrar `database/database.json` para a tabela `requests`, mantendo importação dos dados antigos.
3. **Scanner da biblioteca**: criar um serviço que percorre a pasta configurada e atualiza o índice no SQLite.
4. **APIs lendo do banco**: mudar `/videos`, `/api/anime/*` e `/api/releases` para ler do SQLite, preservando o formato atual das respostas.
5. **Jobs de thumbnails**: transformar thumbnails em uma fila explícita com estado persistido.
6. **Melhorias futuras**: busca melhor, progresso assistido, favoritos, revisão de pedidos e observabilidade.

### Como propor mudanças grandes

- Explica o problema real antes da solução.
- Mostra como a mudança preserva comportamento atual.
- Evita PRs gigantes: uma mudança arquitetural deve ser quebrada em etapas.
- Inclui testes para regras de negócio, migrations e leitura/escrita de dados.
- Mantém o tom construtivo: a arquitetura atual foi suficiente para começar, e a proposta existe para permitir que o projeto cresça melhor.

### O que evitar por agora

- Não introduzir microservices.
- Não exigir Postgres, Redis, Docker ou cloud.
- Não trocar o frontend como parte da mudança arquitetural.
- Não quebrar URLs ou formatos atuais da API durante a migração.
- Não remover suporte a `info.json`, porque ele é conveniente para quem organiza a biblioteca manualmente.

## Testes

- Usa `node:test` para testes novos no servidor, a menos que exista uma razão forte para adicionar outro runner.
- Testes devem usar pastas temporárias e bancos SQLite temporários.
- Não depender de `.env`, biblioteca real do utilizador ou banco commitado.
- Para mudanças de arquitetura, cobre migrations, repositories, scanner e compatibilidade dos payloads das APIs.

## Bugs / sugestões

Abre uma Issue antes de começar a trabalhar em algo grande, para alinhar.
