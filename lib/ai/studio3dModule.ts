export interface Node3DState {
  id: string;
  name: string;
  status: "active" | "idle" | "error";
  coordinates: { x: number; y: number; z: number };
}

export function getStudioArchitectureNodes(): Node3DState[] {
  return [
    { id: "1", name: "Groq Core LLM", status: "active", coordinates: { x: 0, y: 2, z: 0 } },
    { id: "2", name: "Supabase Vector", status: "active", coordinates: { x: -3, y: 0, z: 1 } },
    { id: "3", name: "Sandbox Engine", status: "active", coordinates: { x: 3, y: 0, z: 1 } },
    { id: "4", name: "Self-Evolution Loop", status: "active", coordinates: { x: 0, y: -2, z: 0 } },
  ];
}