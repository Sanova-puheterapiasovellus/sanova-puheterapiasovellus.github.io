const cookieAccessToken = "refresh_token";
const cookieAuthState = "oauth_state";
const cookiePkceVerifier = "pkce_verifier";
const cookieRefreshToken = "refresh_token";
const defaultBranch = "main";
const defaultClientId = "Iv23li2mrVytdGLl2X8W";
const defaultRedirectUri = "https://sanova-puheterapiasovellus.github.io/management/";
const ghApiVersion = "2022-11-28";
const ghJsonContentType = "application/vnd.github+json";
const ghRepoApiBase = "https://api.github.com/repos";
const jsonContentType = "application/json";
const projectRepository = "sanova-puheterapiasovellus/sanova-puheterapiasovellus.github.io";

// Define missing baseline 2025 newly available method
declare global {
    interface Uint8Array {
        toBase64?(options?: { alphabet?: "base64" | "base64url"; omitPadding?: boolean }): string;
    }
}

/** Create a branch based on the existing state of another one. */
export async function createBranch(
    name: string,
    token: string,
    base: string = defaultBranch,
    repository: string = projectRepository,
): Promise<void> {
    const findResponse = await fetch(`${ghRepoApiBase}/${repository}/git/ref/heads/${base}`, {
        method: "get",
        headers: {
            accept: ghJsonContentType,
            authorization: `Bearer ${token}`,
            version: ghApiVersion,
        },
    });

    if (!findResponse.ok) {
        throw new Error("unsuccessful api response", { cause: findResponse });
    }

    const { object: sha } = await findResponse.json();

    const createResponse = await fetch(`${ghRepoApiBase}/${repository}/git/ref/heads/${base}`, {
        method: "post",
        headers: {
            "content-type": jsonContentType,
            accept: ghJsonContentType,
            authorization: `Bearer ${token}`,
            version: ghApiVersion,
        },
        body: JSON.stringify({
            ref: `refs/heads/${name}`,
            sha,
        }),
    });

    if (!createResponse.ok) {
        throw new Error("unsuccessful api response", { cause: findResponse });
    }
}

/** Add or update a file in the repository in a single commit. */
export async function addOrUpdateFile(
    reason: string,
    path: string,
    content: string,
    token: string,
    branch: string = defaultBranch,
    repository: string = projectRepository,
): Promise<void> {
    const response = await fetch(`${ghRepoApiBase}/${repository}/contents/${path}`, {
        method: "put",
        headers: {
            "content-type": jsonContentType,
            accept: ghJsonContentType,
            authorization: `Bearer ${token}`,
            version: ghApiVersion,
        },
        body: JSON.stringify({
            branch,
            message: `sanova-management: ${reason}`,
            content: btoa(content),
        }),
    });

    if (!response.ok) {
        throw new Error("unsuccessful api response", { cause: response });
    }
}

/** Create a pull request and return a link to it. */
export async function createPullRequest(
    reason: string,
    branch: string,
    token: string,
    repository: string = projectRepository,
): Promise<string> {
    const response = await fetch(`${ghRepoApiBase}/${repository}/pulls`, {
        method: "post",
        headers: {
            "content-type": jsonContentType,
            accept: ghJsonContentType,
            authorization: `Bearer ${token}`,
            version: ghApiVersion,
        },
        body: JSON.stringify({
            title: `sanova-management: ${reason}`,
            head: branch,
            base: defaultBranch,
        }),
    });

    if (!response.ok) {
        throw new Error("unsuccessful api response", { cause: response });
    }

    const { html_url } = await response.json();
    return html_url;
}

/** Handle older browsers lacking nice encoding methods. */
function toBase64Url(buffer: Uint8Array): string {
    return (
        buffer.toBase64?.({ alphabet: "base64url", omitPadding: true }) ??
        btoa(String.fromCharCode(...buffer))
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/, "")
    );
}

/** Generate a PKCE verifier and challenge. */
async function generatePkce(): Promise<[string, string]> {
    const verifier = toBase64Url(crypto.getRandomValues(new Uint8Array(32)));

    // yes it's weird that we're supposed to hash the base64url encoded value
    // instead of the actual random data, I guess it leaves the spec a bit more
    // flexible to generating suitable random data some other way
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
    const challenge = toBase64Url(new Uint8Array(digest));

    return [verifier, challenge];
}

/** Build up query parameters for authorizing. */
export async function initiateAuthorizationFlow(
    clientId = defaultClientId,
    redirectUri = defaultRedirectUri,
): Promise<URLSearchParams> {
    const state = crypto.randomUUID();
    const [verifier, challenge] = await generatePkce();

    await Promise.all([
        cookieStore.set(cookieAuthState, state),
        cookieStore.set(cookiePkceVerifier, verifier),
    ]);

    return new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        state,
        code_challenge: challenge,
        code_challenge_method: "S256",
    });
}

/** Store received tokens and return the access token. */
async function handleTokenEndpointResponse(response: Response): Promise<string> {
    const data = await response.json();

    await Promise.all([
        cookieStore.set({
            name: data.cookieAccessToken,
            value: data.access_token,
            expires: data.expires_in,
        }),
        cookieStore.set({
            name: data.cookieRefreshToken,
            value: data.refresh_token,
            expires: data.refresh_token_expires_in,
        }),
    ]);

    return data.access_token;
}

/** Handle having been redirected back to our application. */
export async function handleAuthorizationRedirect(
    query: URLSearchParams,
    clientId = defaultClientId,
    redirectUri = defaultRedirectUri,
): Promise<string> {
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
            client_id: clientId,
            code,
            redirect_uri: redirectUri,
            code_verifier: verifier.value,
        }),
    });

    if (!response.ok) {
        throw new Error("unsuccessful api response", { cause: response });
    }

    return handleTokenEndpointResponse(response);
}

/** Attempt to use previously stored access or refresh token. */
export async function attemptPreExistingToken(
    clientId = defaultClientId,
): Promise<string | undefined> {
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
            client_id: clientId,
            grant_type: "refresh_token",
            refresh_token: refresh.value,
        }),
    });

    if (!response.ok) {
        throw new Error("unsuccessful api response", { cause: response });
    }

    return handleTokenEndpointResponse(response);
}
