# OpenSDD Static Kit

Este kit existe para uso sem instalador CLI.

Ele contem uma estrutura `project-root/` pronta para copiar e colar em qualquer repositorio:

- `AGENT.md`
- `AGENTS.md`
- `README.md`
- `.sdd/` completo (state, core, templates, skills, deposito)
- `openspec/config.yaml`
- `openspec/changes/`

## Uso rapido (manual)

1. Abra `project-root/`.
2. Copie para o seu repositorio os arquivos/pastas que voce quer usar:
- `.sdd/`
- `AGENT.md`
- `AGENTS.md`
- `openspec/`

## Uso rapido (linux/macOS)

Dentro do seu repositorio de destino:

```bash
cp -a /caminho/para/openspec/kits/opensdd-static-kit/project-root/. .
```

## Uso rapido (Windows PowerShell)

Dentro do seu repositorio de destino:

```powershell
Copy-Item -Path "C:\caminho\para\OpenSpec\kits\opensdd-static-kit\project-root\*" -Destination "." -Recurse -Force
```

## Observacoes

- Este kit nao depende de `opensdd install`.
- Se voce quiser evitar sobrescrever `README.md` do projeto destino, copie apenas:
  - `.sdd/`
  - `AGENT.md`
  - `AGENTS.md`
  - `openspec/`
