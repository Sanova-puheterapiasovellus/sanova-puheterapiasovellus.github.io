const cookieAccessToken = "refresh_token";
const cookieAuthState = "oauth_state";
const cookiePkceVerifier = "pkce_verifier";
const cookieRefreshToken = "refresh_token";
const defaultBranch = "main";
const defaultClientId = "Iv23li2mrVytdGLl2X8W";
const defaultRedirectUri = "https://sanova-puheterapiasovellus.github.io/management/";
const ghApiVersion = "2022-11-28";
const ghApiVersionKey = "x-github-api-version";
const ghJsonContentType = "application/vnd.github+json";
const ghRawFileJsonContentType = `application/vnd.github.raw+json`;
const ghRepoApiBase = "https://api.github.com/repos";
const jsonContentType = "application/json";
const projectRepository = "sanova-puheterapiasovellus/sanova-puheterapiasovellus.github.io";

// Define missing baseline 2025 newly available method
declare global {
    interface Uint8Array {
        toBase64?(options?: { alphabet?: "base64" | "base64url"; omitPadding?: boolean }): string;
    }
}

/** Class for managing a GitHub repository through the REST API. */
export class ManagementClient {
    #token: string;
    #repository: string;

    constructor(token: string, repository = projectRepository) {
        this.#token = token;
        this.#repository = repository;
    }

    /** Wait for an appropriate time between mutative requests. */
    static waitBetweenRequests(duration = 1000): Promise<void> {
        return new Promise((resolve) => window.setTimeout(resolve, duration));
    }

    /** Get suitable timeout value that GitHub provided. */
    static #determineProvidedTimeout(headers: Headers): number | null {
        // Handle being provided a number of seconds to wait for.
        const duration = headers.get("retry-after");
        if (duration !== null) {
            return Number.parseInt(duration, 10) * 1000;
        }

        // Handle being given a timestamp to repeat after.
        if (headers.get("x-ratelimit-remaining") === "0") {
            const when = headers.get("x-ratelimit-reset");
            if (when !== null) {
                return Number.parseInt(when, 10) * 1000 - Date.now();
            }
        }

        return null;
    }

    /** Middleware function for handling request timeouts. */
    static async #withTimeoutMiddleware(
        request: Request,
        retries = 3,
        timeout = 60 * 1000,
    ): Promise<Response> {
        let response: Response;
        let attempt = 0;
        do {
            response = await fetch(request);

            // We only care about GitHub's rate limit responses, and yes, it's
            // not an entirely semantically correct status code.
            if (response.status !== 403) {
                break;
            }

            // Check if GitHub specified a timeout value.
            let wait = ManagementClient.#determineProvidedTimeout(request.headers);

            // Default to exponentially growing timeout.
            if (wait === null) {
                wait = timeout = timeout * 2 ** attempt;
            }

            // Actually do the waiting and notify user.
            await ManagementClient.waitBetweenRequests(wait);
        } while (attempt++ < retries);
        return response;
    }

    /** Create a branch based on the existing state of another one. */
    async createBranch(name: string, base: string = defaultBranch): Promise<void> {
        const findResponse = await ManagementClient.#withTimeoutMiddleware(
            new Request(`${ghRepoApiBase}/${this.#repository}/git/ref/heads/${base}`, {
                method: "get",
                headers: {
                    accept: ghJsonContentType,
                    authorization: `Bearer ${this.#token}`,
                    [ghApiVersionKey]: ghApiVersion,
                },
            }),
        );

        if (!findResponse.ok) {
            throw new Error("unsuccessful api response", { cause: findResponse });
        }

        const {
            object: { sha },
        } = await findResponse.json();

        const createResponse = await ManagementClient.#withTimeoutMiddleware(
            new Request(`${ghRepoApiBase}/${this.#repository}/git/refs`, {
                method: "post",
                headers: {
                    "content-type": jsonContentType,
                    accept: ghJsonContentType,
                    authorization: `Bearer ${this.#token}`,
                    [ghApiVersionKey]: ghApiVersion,
                },
                body: JSON.stringify({
                    ref: `refs/heads/${name}`,
                    sha,
                }),
            }),
        );

        if (!createResponse.ok) {
            throw new Error("unsuccessful api response", { cause: await createResponse.json() });
        }
    }

    /** Add or update a file in the repository in a single commit. */
    async addOrUpdateFile(
        reason: string,
        path: string,
        content: string,
        branch: string = defaultBranch,
    ): Promise<void> {
        const response = await ManagementClient.#withTimeoutMiddleware(
            new Request(`${ghRepoApiBase}/${this.#repository}/contents/${path}`, {
                method: "put",
                headers: {
                    "content-type": jsonContentType,
                    accept: ghJsonContentType,
                    authorization: `Bearer ${this.#token}`,
                    [ghApiVersionKey]: ghApiVersion,
                },
                body: JSON.stringify({
                    branch,
                    message: `sanova-management: ${reason}`,
                    content: btoa(content),
                }),
            }),
        );

        if (!response.ok) {
            throw new Error("unsuccessful api response", { cause: response });
        }
    }

    /** Get the current file hash that deleting files needs for some reason. */
    async #getFileHash(path: string, branch: string = defaultBranch): Promise<string | undefined> {
        const response = await ManagementClient.#withTimeoutMiddleware(
            new Request(`${ghRepoApiBase}/${this.#repository}/contents/${path}?ref=${branch})}`, {
                method: "get",
                headers: {
                    "content-type": jsonContentType,
                    accept: ghRawFileJsonContentType,
                    authorization: `Bearer ${this.#token}`,
                    [ghApiVersionKey]: ghApiVersion,
                },
            }),
        );

        if (response.status === 404) {
            return undefined;
        }

        if (!response.ok) {
            throw new Error("unsuccessful api response", { cause: response });
        }

        const { sha } = await response.json();
        return sha;
    }

    /** Delete a file from the repository. */
    async ensureFileDeleted(
        reason: string,
        path: string,
        branch: string = defaultBranch,
    ): Promise<void> {
        const sha = await this.#getFileHash(path, branch);
        if (sha === undefined) {
            return;
        }

        const response = await ManagementClient.#withTimeoutMiddleware(
            new Request(`${ghRepoApiBase}/${this.#repository}/contents/${path}`, {
                method: "delete",
                headers: {
                    "content-type": jsonContentType,
                    accept: ghJsonContentType,
                    authorization: `Bearer ${this.#token}`,
                    [ghApiVersionKey]: ghApiVersion,
                },
                body: JSON.stringify({
                    sha,
                    branch,
                    message: `sanova-management: ${reason}`,
                }),
            }),
        );

        if (!response.ok) {
            throw new Error("unsuccessful api response", { cause: response });
        }
    }

    /** Create a pull request and return a link to it. */
    async createPullRequest(reason: string, branch: string): Promise<string> {
        const response = await ManagementClient.#withTimeoutMiddleware(
            new Request(`${ghRepoApiBase}/${this.#repository}/pulls`, {
                method: "post",
                headers: {
                    "content-type": jsonContentType,
                    accept: ghJsonContentType,
                    authorization: `Bearer ${this.#token}`,
                    [ghApiVersionKey]: ghApiVersion,
                },
                body: JSON.stringify({
                    title: `sanova-management: ${reason}`,
                    head: branch,
                    base: defaultBranch,
                }),
            }),
        );

        if (!response.ok) {
            throw new Error("unsuccessful api response", { cause: response });
        }

        const { html_url } = await response.json();
        return html_url;
    }
}

/** Class for managing a GitHub authorization flow.  */
export class AuthorizationClient {
    #id: string;
    #redirect: string;

    constructor(id: string = defaultClientId, redirect: string = defaultRedirectUri) {
        this.#id = id;
        this.#redirect = redirect;
    }

    /** Handle older browsers lacking nice encoding methods. */
    static #toBase64Url(buffer: Uint8Array): string {
        return (
            buffer.toBase64?.({ alphabet: "base64url", omitPadding: true }) ??
            btoa(String.fromCharCode(...buffer))
                .replace(/\+/g, "-")
                .replace(/\//g, "_")
                .replace(/=+$/, "")
        );
    }

    /** Generate a PKCE verifier and challenge. */
    static async #generatePkce(): Promise<[string, string]> {
        const verifier = AuthorizationClient.#toBase64Url(
            crypto.getRandomValues(new Uint8Array(32)),
        );

        // yes it's weird that we're supposed to hash the base64url encoded value
        // instead of the actual random data, I guess it leaves the spec a bit more
        // flexible to generating suitable random data some other way
        const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
        const challenge = AuthorizationClient.#toBase64Url(new Uint8Array(digest));

        return [verifier, challenge];
    }

    /** Store received tokens and return the access token. */
    static async #handleTokenResponse(response: Response): Promise<string> {
        const data = await response.json();

        await Promise.all([
            cookieStore.set({
                name: cookieAccessToken,
                value: data.access_token,
                expires: data.expires_in,
            }),
            cookieStore.set({
                name: cookieRefreshToken,
                value: data.refresh_token,
                expires: data.refresh_token_expires_in,
            }),
        ]);

        return data.access_token;
    }

    /** Build up query parameters for authorizing. */
    async initiateFlow(): Promise<URLSearchParams> {
        const state = crypto.randomUUID();
        const [verifier, challenge] = await AuthorizationClient.#generatePkce();

        await Promise.all([
            cookieStore.set(cookieAuthState, state),
            cookieStore.set(cookiePkceVerifier, verifier),
        ]);

        return new URLSearchParams({
            client_id: this.#id,
            redirect_uri: this.#redirect,
            state,
            code_challenge: challenge,
            code_challenge_method: "S256",
        });
    }

    /** Handle having been redirected back to our application. */
    async handleRedirect(query: URLSearchParams): Promise<string> {
        const code = query.get("code");
        const [state, verifier] = await Promise.all([
            cookieStore.get(cookieAuthState),
            cookieStore.get(cookiePkceVerifier),
        ]);

        if (code === null || verifier === null || query.get("state") !== state?.value) {
            throw new Error("invalid oauth state");
        }

        const response = await fetch("https://github.com/login/oauth/access_token", {
            method: "post",
            headers: {
                "Content-Type": jsonContentType,
                Accept: jsonContentType,
            },
            body: JSON.stringify({
                client_id: this.#id,
                code,
                redirect_uri: this.#redirect,
                code_verifier: verifier.value,
            }),
        });

        if (!response.ok) {
            throw new Error("unsuccessful api response", { cause: response });
        }

        return AuthorizationClient.#handleTokenResponse(response);
    }

    /** Attempt to use previously stored access or refresh token. */
    async attemptExisting(): Promise<string | undefined> {
        const access = await cookieStore.get(cookieAccessToken);
        if (access !== null) {
            return access.value;
        }

        const refresh = await cookieStore.get(cookieRefreshToken);
        if (refresh === null) {
            return;
        }

        const response = await fetch("https://github.com/login/oauth/access_token", {
            method: "post",
            headers: {
                "Content-Type": jsonContentType,
                Accept: jsonContentType,
            },
            body: JSON.stringify({
                client_id: this.#id,
                grant_type: "refresh_token",
                refresh_token: refresh.value,
            }),
        });

        if (!response.ok) {
            throw new Error("unsuccessful api response", { cause: response });
        }

        return AuthorizationClient.#handleTokenResponse(response);
    }
}
