import { Agent, AgentNamespace, getAgentByName } from "agents";
import { Hono } from "hono";
import { Octokit } from "@octokit/rest";

const userAgent = "ReconAgent v9000";

interface Env {
	ReconAgent: AgentNamespace<ReconAgent>;
	GITHUB_TOKEN: string;
	TWILIO_ACCOUNT_SID: string;
	TWILIO_AUTH_TOKEN: string;
	watchedRepositories: string[];
	notificationEmails: string[];
	notificationPhoneNumbers: string[];
	checkIntervalHours: number;
	notBeforeDate: string;
}

interface SecurityAdvisory {
	ghsa_id: string;
	user: string;
	repo: string;
	summary: string;
	severity: string;
	url: string;
	publishedAt: Date;
	createdAt: Date;
	wasNotified: boolean;
}

export class ReconAgent extends Agent<Env> {
	onStart() {
		if (!this.env.GITHUB_TOKEN) {
			throw new Error(`GITHUB_TOKEN is not set: got ${this.env.GITHUB_TOKEN.slice(0, 4)}`);
		}

		if (!this.env.watchedRepositories || this.env.watchedRepositories.length === 0) {
			throw new Error(`watchedRepositories is not set`);
		}

		console.info(`ReconAgent started: scan interval set to ${this.env.checkIntervalHours} hours`);
		this.setSchema();
		// this.schedule('0 * * * *', 'checkSecurityAdvisories', {});
	}

	setSchema() {
		try {
			let table = this.sql`CREATE TABLE IF NOT EXISTS security_advisories (
			ghsa_id TEXT NOT NULL,
			user TEXT NOT NULL,
			repo TEXT NOT NULL,
			summary TEXT NOT NULL,
			severity TEXT NOT NULL,
			url TEXT NOT NULL,
			published_at TIMESTAMP NOT NULL,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			was_notified INTEGER NOT NULL DEFAULT 0
		)`;
			let index = this.sql`CREATE INDEX IF NOT EXISTS idx_security_advisories_ghsa_id ON security_advisories (ghsa_id)`;
		} catch (e) {
			let msg = `failed to run migrations: ${(e as Error).message}`;
			console.error(msg);
			throw msg;
		}
	}

	async onRequest(request: Request) {
		await this.checkSecurityAdvisories();
		let resp = this.sql<SecurityAdvisory>`SELECT * FROM security_advisories ORDER BY created_at DESC`;
		return Response.json({ resp });
	}

	onError(connection: unknown, error?: unknown): void | Promise<void> {
		console.error(`onError handler: ${error}`);
	}

	// Scan the repositories
	async checkSecurityAdvisories() {
		// Kick off a scan:
		// 1. Get the list of watchedRepositories
		// 2. Initialize Octokit to check the repositories in parallel using p-map
		// 3. For each repository, fetch the security advisories and scan them
		// 4. If the advisory is new (ghsa_id not in the database) then generate notifications for each
		// 5. Save the advisory to the database for future reference
		const octokit = new Octokit({
			userAgent: userAgent,
			auth: this.env.GITHUB_TOKEN,
		});

		let [owner, repo] = this.env.watchedRepositories[0].split("/");
		console.log(`${owner}/${repo}`);

		// TODO for repo in repos: kick this off w/ p-map
		let advisories = await octokit.rest.securityAdvisories.listRepositoryAdvisories({
			owner,
			repo,
			sort: "published",
			direction: "desc",
			per_page: 10,
		});

		// Drop any older advisories so we're not alerted about them
		let recentAdvisories = advisories.data.filter((advisory) => {
			const createdAt = new Date(advisory.created_at || "");
			return createdAt > new Date(this.env.notBeforeDate);
		});

		for (let advisory of recentAdvisories) {
			if (!(await this.checkIfAdvisoryExists(advisory.ghsa_id))) {
				// TODO: convert advistory to our SecurityAdvisory type
				console.info(JSON.stringify(advisory));
				// TODO: summarize advisory with LLM
				// await this.summarizeAdvisory(advisory);
				// await this.sendNotifications(advisory);
				// await this.saveAdvisory(advisory);
			}
		}
	}

	async checkIfAdvisoryExists(ghsaId: string) {
		const result = this.sql`SELECT * FROM security_advisories WHERE ghsa_id = ${ghsaId}`;
		return result.length > 0;
	}

	async summarizeAdvisory(advisory: SecurityAdvisory) {
		return "";
	}

	async sendNotifications(notification: { user: string; repository: string; ghsa_id: string; url: string }) {
		// 1. Generate the notification
		// 2. Use the Resend API to send the email notification
		// 3. If the TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are set and notificationPhoneNumbers is not empty, send SMS notifications
		// 4. Update the notification_sent state in the database
	}

	async saveAdvisory(advisory: SecurityAdvisory) {
		return this
			.sql`INSERT INTO security_advisories (ghsa_id, user, repo, summary, severity, url, published_at, created_at, was_notified) VALUES (${advisory.ghsa_id}, ${advisory.user}, ${advisory.repo}, ${advisory.summary}, ${advisory.severity}, ${advisory.url}, ${advisory.publishedAt.getTime()}, ${advisory.createdAt.getTime()}, ${advisory.wasNotified})`;
	}

	async reviewCommits(user: string, repo: string, since: Date) {
		// TODO: Review commits since ${since}
		// Combine the commit contents for code-related files only
		// Validate whether the commit has potential security fixes or issues
		// Use a structured response with { rating, findings, summary, commitHash }
		// For any rating > 5, generate a notification
	}
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const app = new Hono();

		app.get("/start/:id", async (c) => {
			let id = c.req.param("id").trim();
			let agent = await getAgentByName<Env, ReconAgent>(env.ReconAgent, id);
			return agent.fetch(request);
		});

		return app.fetch(request, env, ctx);
	},
} satisfies ExportedHandler<Env>;
