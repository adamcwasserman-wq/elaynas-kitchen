# Testing and releasing

The game lives in two places:

| | Address | Changes when |
|---|---|---|
| **Testing copy** | https://adamcwasserman-wq.github.io/elaynas-kitchen/ | Every time a change is pushed to `main` here |
| **Real game** (the friends link) | https://adamcwasserman-wq.github.io/tulip-kitchen/ | Only when you press Release |

The testing copy shows a red "Testing copy" tag at the top and says so at the bottom of Settings.
It keeps its own save (its first visit starts from a copy of the real save on that phone), and it
never sends anything to the leaderboard, so testing can't change the kids' progress or scores.

## Releasing

1. Try the change on the testing copy.
2. On GitHub, open **elaynas-kitchen > Actions > Release > Run workflow**, and press the green **Run workflow** button.
3. When it turns green, the real game updates within a minute or two. Close and reopen the game (twice if needed);
   Settings shows the new version.

## One-time setup: the release token

The Release button needs permission to write to tulip-kitchen.

1. GitHub > your picture > **Settings > Developer settings > Personal access tokens > Fine-grained tokens > Generate new token**.
2. Name: `Tulip Kitchen release`. Expiration: up to a year (set a reminder to renew it).
3. **Repository access: Only select repositories > tulip-kitchen.**
4. **Permissions > Repository permissions:** Contents: **Read and write**, and Workflows: **Read and write**
   (needed because the game's files include this Release button).
5. Generate the token and copy it.
6. Open **elaynas-kitchen > Settings > Secrets and variables > Actions > New repository secret**.
   Name: `RELEASE_TOKEN`. Secret: paste the token. Save.
