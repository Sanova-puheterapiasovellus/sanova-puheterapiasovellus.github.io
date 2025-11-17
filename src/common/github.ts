const defaultBranch = "main";
const ghApiVersion = "2022-11-28";
const ghJsonContentType = "application/vnd.github+json";
const ghRepoApiBase = "https://api.github.com/repos";
const jsonContentType = "application/json";
const projectRepository = "sanova-puheterapiasovellus/sanova-puheterapiasovellus.github.io";

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
