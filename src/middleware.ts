import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

// Protect all dashboard routes — login page is excluded
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/posts/:path*",
    "/profiles/:path*",
    "/clients/:path*",
    "/locations/:path*",
    "/calendar/:path*",
    "/team/:path*",
    "/settings/:path*",
  ],
};
