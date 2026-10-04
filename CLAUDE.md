# Regras do projeto

## Commits

- Use Conventional Commits, em inglês (ex.: `feat: add login form`).
- Apenas a linha de assunto: sem corpo e sem mensagem adicional.
- Sem `Co-Authored-By` e sem qualquer linha de atribuição ao Claude (nem `Claude-Session`).
- O autor do commit é o usuário: `André Adriano <a000.andre@gmail.com>`. Passe a identidade no commit (`git -c user.name=... -c user.email=... commit`) em vez de alterar a configuração do git.
- Vale para todo commit, sempre.

## Agent skills

### Issue tracker

Issues e specs ficam no GitHub Issues de `andre000/i-hunt-front`. Ver `docs/agents/issue-tracker.md`.

### Triage labels

Rótulos padrão: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. Ver `docs/agents/triage-labels.md`.

### Domain docs

Contexto único: um `GLOSSARY.md` e `docs/adr/` na raiz. Ver `docs/agents/domain.md`.
