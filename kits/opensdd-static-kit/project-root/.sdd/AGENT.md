
<!-- SDD:GUIA:START -->
# Guia Operacional SDD

Trilha oficial:
1. Rode `opensdd sdd onboard system`.
2. Use `opensdd sdd next` para escolher trabalho pronto.
3. Use `opensdd sdd start FEAT-###` para abrir execução.
4. Use `opensdd sdd context FEAT-###` antes de codar.
5. Após archive, rode `opensdd sdd finalize --ref FEAT-###`.

Fontes canônicas:
- Estados: `.sdd/state/*.yaml`
- Views: `.sdd/core/*.md` e `.sdd/pendencias/*.md`
- Workspace ativo por feature: `.sdd/active/FEAT-###/`
- Deposito bruto: `.sdd/deposito/` (PRDs, RFCs, wireframes e referencias)
<!-- SDD:GUIA:END -->
