After cloning the git, run

```
npm install hono
```

Then,

```
npx wrangler dev
```

Grab the ID of the secret store; should be captioned with "SECRET:", line before reads "Secrets Store Secrets:". You just want the number, not the part after the slash. Then run:

```
npx wrangler secrets-store secret create --remote=false <ID OF SECRET STORE> --name pass --scopes workers --value "<PASS>"
```

Then, set up the database with:

```
wrangler d1 execute liberties-shops --file=src/db/schema.sql
```

After that, run this any time to start the local testing instance:

```
npx wrangler dev
```
