import { httpRouter } from "convex/server";
import { auth } from "./auth";

const http = httpRouter();

// Register authentication HTTP routes
// This exposes endpoints at /api/auth/* for signin, signup, OAuth callbacks, etc.
auth.addHttpRoutes(http);

export default http;
