import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import OneSignalProvider from "../components/OneSignalProvider";

export const metadata = {
  title: "RK Education | Premium Online Classes",
  description: "Upload educational content and sell your preparation batches.",
  manifest: "/manifest.json",
  themeColor: "#4f46e5",
  viewport: "minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, viewport-fit=cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <OneSignalProvider>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </OneSignalProvider>
      </body>
    </html>
  );
}
