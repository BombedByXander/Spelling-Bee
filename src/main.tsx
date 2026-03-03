import { createRoot } from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import App from "./App.tsx";
import "./index.css";

const restoreSpaPathFromQuery = () => {
	const url = new URL(window.location.href);
	const encodedSpaPath = url.searchParams.get("__spa");
	if (!encodedSpaPath) return;

	const decodedSpaPath = decodeURIComponent(encodedSpaPath);
	const normalizedPath = decodedSpaPath.startsWith("/") ? decodedSpaPath : `/${decodedSpaPath}`;
	window.history.replaceState({}, "", normalizedPath);
};

restoreSpaPathFromQuery();

createRoot(document.getElementById("root")!).render(
	<>
		<App />
		<Analytics />
	</>
);

