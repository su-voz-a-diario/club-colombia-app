import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import { DemoProvider } from "@/context/DemoContext";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata = {
  title: "Escuela de Fútbol Club Colombia | Gestión Integral",
  description: "Plataforma oficial de gestión, rendimiento deportivo y pagos recurrentes para padres, atletas y entrenadores de la Escuela de Fútbol Club Colombia.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="es"
      className={`${outfit.variable} ${inter.variable} h-full antialiased dark`}
    >
      <body className="min-h-full bg-[#07090e] text-[#ededed] font-sans flex flex-col">
        <DemoProvider>
          {children}
        </DemoProvider>
      </body>
    </html>
  );
}

