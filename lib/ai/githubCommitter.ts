import { getNeuroniUtente } from "@/lib/db/memory";

export async function commitFileToGitHub(filePath: string, content: string, commitMessage: string): Promise<{ success: boolean; message: string }> {
  // Tentativo di recupero dinamico delle credenziali dalla memoria neurale o dall'ambiente
  let token = process.env.GITHUB_TOKEN;
  let owner = process.env.GITHUB_OWNER || process.env.GITHUB_REPO_OWNER;
  let repo = process.env.GITHUB_REPO;

  // Se non presenti nell'ambiente, l'entità interroga la memoria di Supabase per reperirle in autonomia
  if (!token || !owner || !repo) {
    try {
      const neuroniAdmin = await getNeuroniUtente("admin-super-unix");
      const configNode = neuroniAdmin.find(n => n.title === "GitHubConfig" || n.title === "SystemCredentials");
      if (configNode && configNode.content) {
        const parsedConfig = JSON.parse(configNode.content);
        token = token || parsedConfig.token;
        owner = owner || parsedConfig.owner;
        repo = repo || parsedConfig.repo;
      }
    } catch (err) {
      console.error("Impossibile recuperare le credenziali dalla memoria neurale:", err);
    }
  }

  if (!token || !owner || !repo) {
    return {
      success: false,
      message: "Credenziali GitHub non trovate né nell'ambiente né nella memoria neurale autonoma."
    };
  }

  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
    const getRes = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "vnd.github+json",
        "User-Agent": "Unix-AI-Autonomous-Agent"
      }
    });

    let sha: string | undefined = undefined;
    if (getRes.ok) {
      const fileData = await getRes.json();
      sha = fileData.sha;
    }

    const putRes = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "vnd.github+json",
        "Content-Type": "application/json",
        "User-Agent": "Unix-AI-Autonomous-Agent"
      },
      body: JSON.stringify({
        message: commitMessage,
        content: Buffer.from(content).toString("base64"),
        sha: sha
      })
    });

    if (!putRes.ok) {
      const errData = await putRes.json();
      throw new Error(errData.message || "Errore durante il commit su GitHub");
    }

    return {
      success: true,
      message: `L'entità ha completato con successo il commit autonomo del file ${filePath} su GitHub.`
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Errore durante la scrittura autonoma su GitHub: ${error.message}`
    };
  }
}