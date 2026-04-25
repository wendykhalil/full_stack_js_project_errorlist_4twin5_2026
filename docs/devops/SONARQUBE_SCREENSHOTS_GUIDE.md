# SonarQube BEFORE / AFTER Screenshot Guide

## BEFORE correction

Use the current project state as the baseline. Take screenshots of:

1. Overview page.
2. Bugs.
3. Vulnerabilities.
4. Code Smells.
5. Coverage.
6. Duplications if visible.

Do not hide the low coverage. The goal is to prove improvement.

## AFTER correction

After running tests/refactoring, run:

```powershell
sonar-scanner
```

Then take the same screenshots again and compare:

- Bugs decreased.
- Code Smells decreased.
- Coverage increased.
- Quality gate improved.

## Local command used

```powershell
sonar-scanner -D"sonar.login=YOUR_TOKEN"
```

or put this in `sonar-project.properties`:

```properties
sonar.host.url=http://localhost:9000
sonar.login=YOUR_TOKEN
```
