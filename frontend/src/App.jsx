import { useEffect, useState } from "react";
import { api } from "./api";
import "./App.css";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [files, setFiles] = useState([]);
  const [allFiles, setAllFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [allFolders, setAllFolders] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [folderName, setFolderName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [user, setUser] = useState(null);
  const [section, setSection] = useState("recent");
  const [selectedFile, setSelectedFile] = useState(null);
  const [renameName, setRenameName] = useState("");
  const [message, setMessage] = useState("");

  async function login(event) {
    event.preventDefault();
    try {
      const result = await api.request("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem("token", result.token);
      setToken(result.token);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function loadWorkspace(folder = currentFolder, search = activeSearch) {
    const fileParams = new URLSearchParams();
    const folderParams = new URLSearchParams();
    if (folder) {
      fileParams.set("folderId", folder.id);
      folderParams.set("parentFolderId", folder.id);
    }
    if (search) {
      fileParams.set("search", search);
      folderParams.set("search", search);
    }
    const fileQuery = fileParams.toString() ? `?${fileParams}` : "";
    const folderQuery = folderParams.toString() ? `?${folderParams}` : "";
    const [fileResult, folderResult] = await Promise.all([
      api.authRequest(`/files${fileQuery}`, token),
      api.authRequest(`/folders${folderQuery}`, token),
    ]);
    setFiles(fileResult.files);
    setFolders(folderResult.folders);
  }

  async function loadDashboard() {
    const [fileResult, folderResult, userResult] = await Promise.all([
      api.authRequest("/files?all=true", token),
      api.authRequest("/folders?all=true", token),
      api.authRequest("/auth/me", token),
    ]);
    setAllFiles(fileResult.files);
    setAllFolders(folderResult.folders);
    setUser(userResult.user);
  }

  useEffect(() => {
    if (!token) return;
    let isCurrent = true;
    Promise.all([
      api.authRequest("/files", token),
      api.authRequest("/folders", token),
      api.authRequest("/files?all=true", token),
      api.authRequest("/folders?all=true", token),
      api.authRequest("/auth/me", token),
    ])
      .then(([fileResult, folderResult, allFileResult, allFolderResult, userResult]) => {
        if (!isCurrent) return;
        setFiles(fileResult.files);
        setFolders(folderResult.folders);
        setAllFiles(allFileResult.files);
        setAllFolders(allFolderResult.folders);
        setUser(userResult.user);
      })
      .catch((error) => {
        if (isCurrent) setMessage(error.message);
      });
    return () => {
      isCurrent = false;
    };
  }, [token]);

  function signOut() {
    localStorage.removeItem("token");
    setToken(null);
  }

  async function refreshAfterChange() {
    await Promise.all([loadWorkspace(), loadDashboard()]);
  }

  async function searchWorkspace(event) {
    event.preventDefault();
    const search = searchTerm.trim();
    setActiveSearch(search);
    try {
      await loadWorkspace(currentFolder, search);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function clearSearch() {
    setSearchTerm("");
    setActiveSearch("");
    try {
      await loadWorkspace(currentFolder, "");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function uploadFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    const contentType = file.type || "application/octet-stream";
    try {
      const upload = await api.authRequest("/files/upload-url", token, {
        method: "POST",
        body: JSON.stringify({
          filename: file.name,
          contentType,
          size: file.size,
          folderId: currentFolder?.id,
        }),
      });
      const uploadResponse = await fetch(upload.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: file,
      });
      if (!uploadResponse.ok) throw new Error(`S3 upload failed: ${uploadResponse.status}`);
      await api.authRequest("/files/complete", token, {
        method: "POST",
        body: JSON.stringify({ fileId: upload.fileId }),
      });
      await refreshAfterChange();
    } catch (error) {
      setMessage(error.message);
    }
    event.target.value = "";
  }

  async function createFolder(event) {
    event.preventDefault();
    if (!folderName.trim()) return;
    try {
      await api.authRequest("/folders", token, {
        method: "POST",
        body: JSON.stringify({ name: folderName, parentFolderId: currentFolder?.id }),
      });
      setFolderName("");
      await refreshAfterChange();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function openFolder(folder) {
    setCurrentFolder(folder);
    setSection("files");
    setSearchTerm("");
    setActiveSearch("");
    try {
      await loadWorkspace(folder, "");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function goToRoot() {
    setCurrentFolder(null);
    setSearchTerm("");
    setActiveSearch("");
    try {
      await loadWorkspace(null, "");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function downloadFile(fileId) {
    const result = await api.authRequest(`/files/${fileId}/download`, token);
    window.open(result.downloadUrl, "_blank");
  }

  async function deleteFile(file) {
    if (!window.confirm(`Delete ${file.original_name}?`)) return;
    try {
      await api.authRequest(`/files/${file.id}`, token, { method: "DELETE" });
      await refreshAfterChange();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function deleteFolder(folder) {
    if (!window.confirm(`Delete ${folder.name} and everything inside it?`)) return;
    try {
      await api.authRequest(`/folders/${folder.id}`, token, { method: "DELETE" });
      await refreshAfterChange();
    } catch (error) {
      setMessage(error.message);
    }
  }

  function folderPath(folderId) {
    const folderMap = new Map(allFolders.map((folder) => [folder.id, folder]));
    const names = [];
    const visited = new Set();
    let folder = folderMap.get(folderId);
    while (folder && !visited.has(folder.id)) {
      names.unshift(folder.name);
      visited.add(folder.id);
      folder = folderMap.get(folder.parent_folder_id);
    }
    return names.join(" / ");
  }

  function filePath(file) {
    const path = folderPath(file.folder_id);
    return path ? `${path} / ${file.original_name}` : file.original_name;
  }

  function formatDate(date) {
    return new Date(date).toLocaleString();
  }

  function formatSize(size) {
    const bytes = Number(size);
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function openProperties(file) {
    setSelectedFile(file);
    setRenameName(file.original_name);
  }

  async function renameFile(event) {
    event.preventDefault();
    if (!selectedFile || !renameName.trim()) return;
    try {
      await api.authRequest(`/files/${selectedFile.id}`, token, {
        method: "PATCH",
        body: JSON.stringify({ name: renameName.trim() }),
      });
      setSelectedFile(null);
      await refreshAfterChange();
    } catch (error) {
      setMessage(error.message);
    }
  }

  if (!token) {
    return (
      <main className="login">
        <p className="eyebrow">PRIVATE STORAGE</p>
        <h1>Keep your files close.</h1>
        <p className="muted">A simple private file space for your team and your work.</p>
        <form onSubmit={login}>
          <input type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <input type="password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          <button type="submit">Sign in</button>
        </form>
        <p className="error">{message}</p>
      </main>
    );
  }

  const recentFiles = [...allFiles]
    .sort((left, right) => new Date(right.created_at) - new Date(left.created_at))
    .slice(0, 10);
  const shownFiles = section === "recent" ? recentFiles : currentFolder ? files : allFiles;

  return (
    <main className="workspace">
      <header>
        <div>
          <p className="eyebrow">YOUR SPACE</p>
          <h1>Files</h1>
          {user && <p className="account">Signed in as {user.email}</p>}
        </div>
        <button className="quiet" onClick={signOut}>Sign out</button>
      </header>

      <section className="toolbar">
        <label className="upload">Upload file<input type="file" onChange={uploadFile} /></label>
        <form className="new-folder" onSubmit={createFolder}>
          <input aria-label="New folder name" placeholder="New folder name" value={folderName} onChange={(event) => setFolderName(event.target.value)} />
          <button type="submit">Create folder</button>
        </form>
        <span className="muted">{allFiles.length} files</span>
      </section>

      <form className="search" onSubmit={searchWorkspace}>
        <input type="search" aria-label="Search files and folders" placeholder="Search files and folders" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
        <button type="submit">Search</button>
        {activeSearch && <button className="clear-search" type="button" onClick={clearSearch}>Clear</button>}
      </form>

      <p className="error">{message}</p>

      <nav className="sections" aria-label="File sections">
        <button className={section === "directories" ? "active" : ""} onClick={() => setSection("directories")}>All directories <span>{allFolders.length}</span></button>
        <button className={section === "files" ? "active" : ""} onClick={() => setSection("files")}>All files <span>{allFiles.length}</span></button>
        <button className={section === "recent" ? "active" : ""} onClick={() => setSection("recent")}>Recents <span>{recentFiles.length}</span></button>
      </nav>

      {section === "directories" ? (
        <section>
          <div className="section-heading"><h2>All directories</h2><span className="muted">Every folder in your space</span></div>
          <section className="folder-list">
            {allFolders.map((folder) => (
              <div className="folder" key={folder.id}>
                <button className="folder-open" onClick={() => openFolder(folder)}><strong>{folder.name}</strong><small>{folderPath(folder.parent_folder_id) || "Root directory"}</small></button>
                <button className="delete" type="button" onClick={() => deleteFolder(folder)}>Delete</button>
              </div>
            ))}
          </section>
        </section>
      ) : (
        <>
          <nav className="breadcrumbs" aria-label="Folder navigation">
            <button className={!currentFolder ? "active" : ""} onClick={goToRoot}>All files</button>
            {currentFolder && <span>/</span>}
            {currentFolder && <strong>{currentFolder.name}</strong>}
          </nav>
          <div className="section-heading"><h2>{section === "recent" ? "Recent uploads" : "All files"}</h2><span className="muted">{section === "recent" ? "Your latest 10 uploads" : "Files from every directory and root space"}</span></div>
          {section !== "recent" && section !== "files" && <section className="folder-list">{folders.map((folder) => <div className="folder" key={folder.id}><button className="folder-open" onClick={() => openFolder(folder)}><strong>{folder.name}</strong><small>Open folder</small></button><button className="delete" type="button" onClick={() => deleteFolder(folder)}>Delete</button></div>)}</section>}
          <section className="file-list">
            {shownFiles.map((file) => (
              <article key={file.id}>
                <div><strong>{filePath(file)}</strong><span>{formatSize(file.size)} · Uploaded {formatDate(file.created_at)}</span></div>
                <div className="file-actions"><button onClick={() => downloadFile(file.id)}>Download</button><button onClick={() => openProperties(file)}>Properties</button><button className="delete" onClick={() => deleteFile(file)}>Delete</button></div>
              </article>
            ))}
            {!shownFiles.length && <p className="empty">No files yet. Upload your first file.</p>}
          </section>
        </>
      )}

      {selectedFile && (
        <div className="modal-backdrop" role="presentation" onClick={() => setSelectedFile(null)}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="properties-title" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header"><div><p className="eyebrow">FILE PROPERTIES</p><h2 id="properties-title">{selectedFile.original_name}</h2></div><button className="quiet" onClick={() => setSelectedFile(null)}>Close</button></div>
            <dl className="metadata"><div><dt>Location</dt><dd>{folderPath(selectedFile.folder_id) || "Root space"}</dd></div><div><dt>Created</dt><dd>{formatDate(selectedFile.created_at)}</dd></div><div><dt>Size</dt><dd>{formatSize(selectedFile.size)}</dd></div><div><dt>Type</dt><dd>{selectedFile.mime_type}</dd></div></dl>
            <form className="rename-form" onSubmit={renameFile}><label htmlFor="rename-file">Rename file</label><input id="rename-file" value={renameName} onChange={(event) => setRenameName(event.target.value)} required /><button type="submit">Save name</button></form>
          </section>
        </div>
      )}
    </main>
  );
}

export default App;
