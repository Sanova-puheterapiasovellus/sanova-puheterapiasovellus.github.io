/** Add or update a file in the repository in a single commit. */
export async function addOrUpdateFile(
    reason: string,
    path: string,
    content: string,
    token: string,
    repository: string = "sanova-puheterapiasovellus/sanova-puheterapiasovellus.github.io",
): Promise<void> {
    const response = await fetch(`https://api.github.com/repos/${repository}/contents/${path}`, {
        method: "put",
        headers: {
            accept: "application/vnd.github+json",
            "content-type": "application/json",
            version: "2022-11-28",
            authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            message: `sanova-management: ${reason}`,
            content: btoa(content),
        }),
    });

    if (!response.ok) {
        throw new Error("unsuccessful api response", { cause: response });
    }
}
