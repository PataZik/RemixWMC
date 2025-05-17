// app/components/PasswortManagerView.jsx
import { Form, useSearchParams } from "@remix-run/react";
import { useState, useEffect } from "react";

export default function PasswortManagerView({ erlaubt, eintraege }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [sichtbar, setSichtbar] = useState(false);
  const [bearbeiteIndex, setBearbeiteIndex] = useState(null);

  // States für Editieren
  const [editWebsite, setEditWebsite] = useState("");
  const [editBenutzername, setEditBenutzername] = useState("");
  const [editPasswort, setEditPasswort] = useState("");

  const [neuesPasswort, setNeuesPasswort] = useState("");
  const [letzteAktivitaet, setLetzteAktivitaet] = useState(Date.now());
  const [generiertFeedback, setGeneriertFeedback] = useState(false);

  // Nach Speichern Edit-Modus verlassen
  useEffect(() => {
    if (searchParams.get("bearbeitet")) {
      setBearbeiteIndex(null);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Auto-Logout nach Inaktivität
  useEffect(() => {
    const timer = setInterval(() => {
      if (Date.now() - letzteAktivitaet > 2 * 60 * 1000) {
        window.location.reload();
      }
    }, 10000);
    const reset = () => setLetzteAktivitaet(Date.now());
    window.addEventListener("mousemove", reset);
    window.addEventListener("keydown", reset);
    return () => {
      clearInterval(timer);
      window.removeEventListener("mousemove", reset);
      window.removeEventListener("keydown", reset);
    };
  }, [letzteAktivitaet]);

  // Passwort-Generator
  const generierePasswort = () => {
    const zeichen = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const länge = Math.floor(Math.random() * 6) + 15;
    let pw = "";
    for (let i = 0; i < länge; i++) {
      pw += zeichen[Math.floor(Math.random() * zeichen.length)];
    }
    setNeuesPasswort(pw);
    setGeneriertFeedback(true);
    setTimeout(() => setGeneriertFeedback(false), 3000);
  };

  const kopiereInZwischenablage = (text) => {
    navigator.clipboard.writeText(text).then(() => alert("Passwort kopiert!"));
  };

  const bewerteSicherheit = (passwort) => {
    let score = 0;
    if (passwort.length >= 8) score += 1;
    if (/[A-Z]/.test(passwort)) score += 1;
    if (/[0-9]/.test(passwort)) score += 1;
    if (/[^A-Za-z0-9]/.test(passwort)) score += 1;
    return score;
  };

  const getBewertung = (score, passwort) => {
    if (passwort.length === 0) return { text: "", color: "transparent", width: "0%" };
    if (passwort.length < 8) return { text: "Zu kurz", color: "#ff4d4d", width: "10%" };
    if (score <= 1) return { text: "Schwach", color: "#ff4d4d", width: "30%" };
    if (score === 2) return { text: "Mittel", color: "#ffbf00", width: "60%" };
    return { text: "Stark", color: "#28a745", width: "100%" };
  };

  const formatDatum = (isoString) => {
    const datum = new Date(isoString);
    return datum.toLocaleString("de-AT", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // gefilterte Einträge nach Suchbegriff
  const gefilterteEintraege = eintraege.filter((e) =>
    e.website.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <style>{`
        html, body {
          margin: 0; padding: 0;
          background-color: #121212;
          color: #ffffff;
          font-family: sans-serif;
          height: 100%;
        }
        *, *::before, *::after { box-sizing: border-box; }
      `}</style>

      {!erlaubt ? (
        <div style={fullScreenStyle}>
          <div style={modalStyle}>
            <h1>🔒 PIN-Schutz</h1>
            <Form method="post" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <input name="pin" type="password" placeholder="PIN eingeben" style={inputStyle} />
              <button type="submit" name="_action" value="pin" style={submitButtonStyle}>
                🔓 Freischalten
              </button>
            </Form>
          </div>
        </div>
      ) : (
        <div style={containerStyle}>
          <h1 style={{ textAlign: "center", marginBottom: "2rem" }}>🔐 Passwort-Manager</h1>

          {/* Neuer Eintrag */}
          <Form method="post" style={formStyle}>
            <input type="hidden" name="_action" value="hinzufuegen" />
            <div>
              <label>🌐 Website:</label><br/>
              <input name="website" required style={inputStyle} />
            </div>
            <div>
              <label>👤 Benutzername:</label><br/>
              <input name="benutzername" required style={inputStyle} />
            </div>
            <div>
              <label>🔑 Passwort:</label><br/>
              <input
                name="passwort"
                type={sichtbar ? "text" : "password"}
                required
                style={inputStyle}
                value={neuesPasswort}
                onChange={(e) => setNeuesPasswort(e.target.value)}
              />
              <div style={meterContainer}>
                <div style={{ width: getBewertung(bewerteSicherheit(neuesPasswort), neuesPasswort).width, backgroundColor: getBewertung(bewerteSicherheit(neuesPasswort), neuesPasswort).color, ...meterBar }} />
              </div>
              <p style={{ fontStyle: "italic", color: getBewertung(bewerteSicherheit(neuesPasswort), neuesPasswort).color }}>
                {getBewertung(bewerteSicherheit(neuesPasswort), neuesPasswort).text}
              </p>
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                <button type="button" onClick={() => setSichtbar(!sichtbar)} style={toggleButtonStyle}>
                  {sichtbar ? "🙈 Verbergen" : "👁️ Anzeigen"}
                </button>
                <button type="button" onClick={generierePasswort} style={toggleButtonStyle}>
                  🔁 Generieren
                </button>
                {generiertFeedback && <span style={{ color: "#28a745", fontWeight: "bold" }}>✅</span>}
              </div>
            </div>
            <button type="submit" style={submitButtonStyle}>➕ Hinzufügen</button>
          </Form>

          {/* Suchfeld */}
          <div style={{ ...formStyle, padding: "0.75rem 1.5rem", boxShadow: "none", marginBottom: "2rem" }}>
            <label style={{ color: "#ccc", marginBottom: "0.5rem", display: "block" }}>🔍 Website suchen:</label>
            <input
              type="text"
              placeholder="z.B. example.com"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ 
                width: "100%", 
                padding: "0.5rem", 
                borderRadius: "6px", 
                border: "1px solid #444", 
                backgroundColor: "#222", 
                color: "#fff" 
              }}
            />
          </div>

          {/* Liste */}
          <div style={listContainer}>
            {gefilterteEintraege.length === 0 && <p>Keine Passwörter gefunden.</p>}
            {gefilterteEintraege.map((e, idx) => {
              const i = idx; // oder nutze einen eindeutigen Key, wenn du einen hast
              const isEditing = bearbeiteIndex === i;
              const existingPW = isEditing ? editPasswort : e.passwort;
              const existingScore = bewerteSicherheit(existingPW);
              const existingBewertung = getBewertung(existingScore, existingPW);

              return (
                <div key={i} style={cardStyle}>
                  {isEditing ? (
                    <Form method="post" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <input type="hidden" name="_action" value="bearbeiten" />
                      <input type="hidden" name="index" value={i} />

                      <label>🌐 Website:</label>
                      <input
                        name="website"
                        style={inputStyle}
                        value={editWebsite}
                        onChange={(e) => setEditWebsite(e.target.value)}
                        required
                      />

                      <label>👤 Benutzername:</label>
                      <input
                        name="benutzername"
                        style={inputStyle}
                        value={editBenutzername}
                        onChange={(e) => setEditBenutzername(e.target.value)}
                        required
                      />

                      <label>🔑 Passwort:</label>
                      <input
                        name="passwort"
                        type={sichtbar ? "text" : "password"}
                        style={inputStyle}
                        value={editPasswort}
                        onChange={(e) => setEditPasswort(e.target.value)}
                        required
                      />
                      <div style={meterContainer}>
                        <div style={{ width: existingBewertung.width, backgroundColor: existingBewertung.color, ...meterBar }} />
                      </div>
                      <p style={{ fontStyle: "italic", color: existingBewertung.color }}>{existingBewertung.text}</p>

                      <div style={{ display: "flex", gap: "0.5rem", marginTop: "auto" }}>
                        <button type="submit" style={submitButtonStyle}>💾 Speichern</button>
                        <button type="button" onClick={() => setBearbeiteIndex(null)} style={cancelButtonStyle}>
                          ✖️ Abbrechen
                        </button>
                      </div>
                    </Form>
                  ) : (
                    <>
                      <p style={{ marginBottom: "0.5rem", wordBreak: "break-word" }}>
                        <a href={e.website} target="_blank" style={{ color: "#61dafb" }}>{e.website}</a>
                      </p>
                      <p><strong>👤 Benutzername:</strong> {e.benutzername}</p>
                      <p style={{ margin: 0, wordBreak: "break-all", overflowWrap: "break-word", marginBottom: "0.5rem" }}>
                        <strong>🔑 Passwort:</strong> {sichtbar ? e.passwort : "••••••"}
                        {sichtbar && (
                          <button type="button" onClick={() => kopiereInZwischenablage(e.passwort)} style={copyButtonStyle}>
                            📋 Kopieren
                          </button>
                        )}
                      </p>
                      {e.updatedAt && (
                        <p style={{ fontSize: "0.75rem", color: "#aaa" }}>
                          📅 {formatDatum(e.updatedAt)}
                        </p>
                      )}
                      <div style={{ display: "flex", gap: "0.5rem", marginTop: "auto" }}>
                        <button type="button" onClick={() => {
                          setBearbeiteIndex(i);
                          setEditWebsite(e.website);
                          setEditBenutzername(e.benutzername);
                          setEditPasswort(e.passwort);
                        }} style={editButton}>
                          ✏️ Bearbeiten
                        </button>
                        <Form method="post" style={{ display: "inline" }}>
                          <input type="hidden" name="_action" value="loeschen" />
                          <input type="hidden" name="index" value={i} />
                          <button type="submit" style={deleteButton}>🗑️ Löschen</button>
                        </Form>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

// ——— Styles ———
const fullScreenStyle = {
  backgroundColor: "#121212",
  height: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};
const modalStyle = {
  backgroundColor: "#1e1e1e",
  padding: "2rem",
  borderRadius: "12px",
  boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
  width: "300px",
  textAlign: "center",
};
const containerStyle = {
  padding: "2rem",
  backgroundColor: "#121212",
  minHeight: "100vh",
};
const formStyle = {
  backgroundColor: "#1e1e1e",
  padding: "1.5rem",
  borderRadius: "10px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
  maxWidth: "600px",
  margin: "0 auto 2rem",
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
};
const inputStyle = {
  width: "100%",
  padding: "0.5rem",
  borderRadius: "6px",
  border: "1px solid #444",
  backgroundColor: "#222",
  color: "#fff",
};
const submitButtonStyle = {
  padding: "0.4rem 0.6rem",
  fontSize: "0.8rem",
  backgroundColor: "#28a745",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "bold",
};
const toggleButtonStyle = {
  padding: "0.2rem 0.4rem",
  fontSize: "0.75rem",
  border: "none",
  backgroundColor: "#333",
  color: "#fff",
  borderRadius: "6px",
  cursor: "pointer",
};
const editButton = {
  padding: "0.4rem 0.6rem",
  fontSize: "0.8rem",
  backgroundColor: "#ffc107",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
};
const deleteButton = {
  padding: "0.4rem 0.6rem",
  fontSize: "0.8rem",
  backgroundColor: "#dc3545",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  color: "#fff",
};
const cancelButtonStyle = {
  padding: "0.3rem 0.5rem",
  fontSize: "0.75rem",
  border: "none",
  borderRadius: "6px",
  backgroundColor: "#555",
  color: "#fff",
  cursor: "pointer",
};
const copyButtonStyle = {
  marginLeft: "0.3rem",
  padding: "0.2rem 0.4rem",
  fontSize: "0.75rem",
  backgroundColor: "#444",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
};
const meterContainer = {
  marginTop: "0.5rem",
  height: "10px",
  backgroundColor: "#333",
  borderRadius: "4px",
  overflow: "hidden",
};
const meterBar = {
  height: "100%",
  transition: "width 0.3s ease",
};
const listContainer = {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "center",
  gap: "1rem",
  padding: "2rem",
  maxWidth: "1280px",
  margin: "0 auto",
};
const cardStyle = {
  backgroundColor: "#1e1e1e",
  padding: "1rem",
  borderRadius: "10px",
  boxShadow: "10 2px 6px rgba(0,0,0,0.3)",
  width: "250px",
  flexShrink: 0,
  display: "flex",
  flexDirection: "column",
  gap: "0rem",          // <–– gleichmäßiger Abstand zwischen allen Kindelementen
  overflowWrap: "break-word",
  wordBreak: "break-all",
};
