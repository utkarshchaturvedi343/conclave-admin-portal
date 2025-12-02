import "./globals.css";
import type { Metadata } from "next";
import MockWorker from "./components/mockWorker";
// import CsrfProvider from "C:/Users/SBI/Desktop/New Folder/app/admin/(panel)/components/CsrfProvider";

export const metadata: Metadata = {
  title: "Events App-Admin Portal",
  description: "Admin portal for SBI Events App",
  icons: {
    icon: "/static/sbi_logo.jpg",
    shortcut: "/static/sbi_logo.jpg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <MockWorker />
        {/* <CsrfProvider />   <-- load CSRF token once */}
        {children}
      </body>
    </html>
  );
}
