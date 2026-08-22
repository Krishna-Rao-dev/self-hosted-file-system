import { useEffect, useState } from "react";
import { api } from "./api";
import "./App.css";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState("");

  async function login(event) {
    event.preventDefault();
    try { const result = await api.request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }); localStorage.setItem("token", result.token); setToken(result.token); } catch (error) { setMessage(error.message); }
  }

  useEffect(() => { if (token) api.authRequest("/files", token).then((result) => setFiles(result.files)).catch((error) => setMessage(error.message)); }, [token]);

  if (!token) return <main className="login"><p className="eyebrow">PRIVATE STORAGE</p><h1>Keep your files close.</h1><p className="muted">A simple private file space for your team and your work.</p><form onSubmit={login}><input type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} required /><input type="password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} required /><button type="submit">Sign in</button></form><p className="error">{message}</p></main>;

  return <main className="workspace"><header><div><p className="eyebrow">YOUR SPACE</p><h1>Files</h1></div><button className="quiet" onClick={() => { localStorage.removeItem("token"); setToken(null); }}>Sign out</button></header><section className="toolbar"><label className="upload">Upload file<input type="file" onChange={async (event) => { const file = event.target.files[0]; if (!file) return; try { const upload = await api.authRequest("/files/upload-url", token, { method: "POST", body: JSON.stringify({ filename: file.name, contentType: file.type || "application/octet-stream", size: file.size }) }); await fetch(upload.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type || "application/octet-stream" }, body: file }); await api.authRequest("/files/complete", token, { method: "POST", body: JSON.stringify({ fileId: upload.fileId }) }); setFiles((await api.authRequest("/files", token)).files); } catch (error) { setMessage(error.message); } }} /></label><span className="muted">{files.length} files</span></section><p className="error">{message}</p><section className="file-list">{files.map((file) => <article key={file.id}><div><strong>{file.original_name}</strong><span>{Math.ceil(Number(file.size) / 1024)} KB</span></div><button onClick={async () => { const result = await api.authRequest(`/files/${file.id}/download`, token); window.open(result.downloadUrl, "_blank"); }}>Download</button></article>)}{!files.length && <p className="empty">No files yet. Upload your first file.</p>}</section></main>;
  
}

export default App;
