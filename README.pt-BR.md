# claude-job-search

[English](README.md)

Plugin do [Claude Code](https://claude.com/claude-code) pra conduzir sua busca de
emprego com o Claude como assistente. Todas as decisões continuam com você.

Ele busca vagas **reais**, pontua cada uma pelos **seus** critérios, mantém um
acompanhamento das candidaturas e prepara currículo e carta de apresentação adaptados
para as vagas que **você** aprovar. Também ajuda no perfil do LinkedIn, na preparação
para entrevista comportamental e na negociação da proposta.

Ele nunca se candidata por você, nunca inventa experiência que você não tem e nunca
inventa vagas.

## O que vem

| | |
|---|---|
| `/job-search:setup` | entrevista curta → seu workspace com preferências, piso salarial, stack e currículo |
| `/job-search:search` | busca real na web → remove duplicadas → nota ponderada → lista ranqueada pra você aprovar |
| `/job-search:tailor <id>` | currículo + carta para uma vaga, no idioma da vaga, com PDF opcional |
| `/job-search:status` | visão das suas candidaturas; registra candidatura, entrevista, proposta, recusa |
| skill `job-search` | peça em linguagem normal: "revisa meu currículo", "me prepara pra entrevista de quinta", "essa proposta é boa?" |

## Instalação

Dentro do Claude Code:

```
/plugin marketplace add BernardoDomingues/claude-job-search
/plugin install job-search@claude-job-search
```

Requisito: Claude Code (que já traz Node.js ≥ 18). Opcionais: `pandoc` com `weasyprint`
ou `wkhtmltopdf` para gerar PDF, e um servidor MCP de navegador (por exemplo o
[Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)) para sites
de vagas que só funcionam num navegador de verdade.

## Começando

1. Abra o Claude Code na pasta onde quer guardar sua busca.
2. Rode `/job-search:setup` e responda às perguntas. Cole seu currículo quando ele pedir.
3. Rode `/job-search:search` e escolha as vagas que gostou na lista.
4. Rode `/job-search:tailor <job-id>` para cada uma, revise o rascunho e se candidate
   você mesmo.
5. Conte ao Claude quando algo mudar ("me candidatei na …", "fui chamado pra entrevista
   na …"), ou use `/job-search:status`.

Quer ver antes? Em [`examples/demo-workspace`](examples/demo-workspace) tem config,
currículo e acompanhamento de uma pessoa fictícia. Use
`JOB_SEARCH_WORKSPACE=examples/demo-workspace` e peça o status.

## Seus dados

Tudo sobre você fica no **seu workspace**: `./job-search` por padrão, ou a pasta definida
em `JOB_SEARCH_WORKSPACE`.

```
job-search/
  config.json        o que você busca: cargos, stack, locais, piso salarial, pesos da nota
  tracking.json      toda vaga já vista, a nota dela e o histórico completo de status
  profile/resume.md  seu currículo, a única fonte de fatos sobre você
  generated/<id>/    rascunhos adaptados por vaga
```

Nada é enviado pra lugar nenhum além das buscas na web que o Claude faz. Se o workspace
estiver dentro de um repositório git, coloque ele no `.gitignore`, porque tem dados
pessoais.

## Como funciona a nota

O Claude dá uma nota de 0 a 1 para cada vaga em cinco eixos, seguindo uma régua escrita:
encaixe técnico, salário, localização, senioridade e qualidade da descrição da vaga. Um
script pequeno faz a conta: aplica seus pesos (padrão 70 / 10 / 10 / 5 / 5), seus
filtros obrigatórios (só presencial, "precisa morar em …", golpe) e seus limites (≥ 0,75
aprova, ≥ 0,50 revisar). A mesma vaga nunca é pontuada duas vezes. Detalhes em
[scoring-model.md](skills/job-search/references/scoring-model.md).

Os status seguem `found → approved → prepared → applied → interviewing → offer`, além de
`rejected` e `error`. O histórico só cresce, nunca é apagado.

## Personalizar

- **Preferências**: edite o `config.json` ou rode `/job-search:setup` de novo.
- **Nota**: mude `scoring.weights` (a soma precisa dar 1) e `scoring.thresholds`.
- **Visual do PDF**: copie `templates/pdf-style.css`, edite e peça ao Claude pra usar a
  sua cópia.
- **Idioma**: o Claude conversa no seu idioma e escreve os rascunhos no idioma da vaga.
  O `output.defaultLanguage` é usado quando o idioma não está claro.

## Desenvolvimento

```bash
npm test            # node:test, sem dependências
npm run coverage    # falha abaixo de 90% de cobertura de linhas em scripts/lib
claude plugin validate .
```

## Créditos e licença

O material de referência foi escrito a partir de fontes públicas, citadas no fim de cada
arquivo em [`skills/job-search/references`](skills/job-search/references).
MIT © Bernardo Domingues. Veja [LICENSE](LICENSE).
