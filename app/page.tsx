import { AppShell } from "@/components/app-shell";
import { AppDataProvider } from "@/lib/repository/provider";

export default function Home() {
  return <AppDataProvider><AppShell /></AppDataProvider>;
}
