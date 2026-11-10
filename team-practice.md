# Team Practice Notes

## Pull Request Workflow

- Pull the latest `main` branch before starting a new branch.
- Write clear commit messages that describe each change.
- Make small, focused changes so they are easier to review.
- Include testing notes in every pull request.
- Ask a teammate to review each pull request before merging.
- Resolve review comments before merging changes into `main`.
## Git Commands

```bash
git switch main
git pull origin main
git switch -c feature/your-feature-name
git add .
git commit -m "Describe your changes"
git push origin feature/your-feature-name
