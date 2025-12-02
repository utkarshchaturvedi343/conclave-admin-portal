let csrfToken: string = "";

export async function loadCsrfToken() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/csrf-token`, {
        credentials: "include",
    });

    const data = await res.json();
    csrfToken = data.csrfToken;
}

export function getCsrfToken() {
    return csrfToken;
}
