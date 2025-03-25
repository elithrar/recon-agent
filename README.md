# ReconAgent

> 🚧 Work in progress

An Agent that can check the state of GitHub repositories for security advisories and notify users when it sees something looks off.

Built using the [Agents SDK](https://developers.cloudflare.com/agents/) + deploys to Cloudflare Workers.

### TODO

- [ ] Wrap up the notification checking and make it concurrent
- [ ] Wire up email notifications
- [ ] Wire up SMS via Twilio
- [ ] Connect up Slack/Google Chat as a notification channel
- [ ] Build a mini dashboard that shows the status of the agent + advisories seen

Further out: scan recent commits for potential security issues and/or fixes before advisories are published.

### Run & Deploy it

The easy way:

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/elithrar/recon-agent)

Manually: clone the repo, set the `GITHUB_TOKEN` secret and set the repositories you want it to watch in `wrangler.json`. Then run:

```bash
# Install dependencies
npm install
# Run it locally
npm run dev
# Deploy it to your own account
npx wrangler@latest deploy
```

### License

Apache-2.0 licensed. See the LICENSE file for details.
