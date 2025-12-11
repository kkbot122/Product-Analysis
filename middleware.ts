// middleware.ts
export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/projects/:path*",
    "/analytics/:path*",
    "/events/:path*",
  ],
};