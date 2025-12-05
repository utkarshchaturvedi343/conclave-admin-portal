import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
    const url = req.nextUrl.clone();

    if (url.pathname.startsWith("/admin")) {
        if (url.pathname === "/admin/login") {
            return NextResponse.next();
        }

        const cookie = req.cookies.get("sessionid")?.value;
        if (!cookie) {
            // no cookie → always redirect to login
            url.pathname = "/admin/login";
            return NextResponse.redirect(url);
        }
        console.log("MIDDLEWARE COOKIE:", cookie);

        const role = cookie.includes("mock-super") ? "super" : cookie.includes("mock-session-token") ? "user" : null;

        if (!role) {
            url.pathname = "/admin/login";
            return NextResponse.redirect(url);
        }
        return NextResponse.next();
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*"],
};
