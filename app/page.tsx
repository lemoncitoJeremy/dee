import { AppShell } from "@/components/app-shell";
import { AppDataProvider } from "@/lib/repository/provider";
import { WebMcpTools } from "@/components/webmcp-tools";

export default function Home() {
  return <AppDataProvider><WebMcpTools /><AppShell /></AppDataProvider>;
}
