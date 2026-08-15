import Link from "next/link";

export default function NotFound() {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui", padding: "2rem", textAlign: "center" }}>
        <h1>404 - Page Not Found</h1>
        <p>The page you are looking for does not exist.</p>
        <Link href="/en">Go home</Link>
      </body>
    </html>
  );
}
