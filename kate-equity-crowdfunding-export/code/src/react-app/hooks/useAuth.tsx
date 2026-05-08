import { useContext } from "react";
import { AuthContext, AuthContextType } from "@/react-app/contexts/AuthContext";

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export type { User } from "@/react-app/contexts/AuthContext";
