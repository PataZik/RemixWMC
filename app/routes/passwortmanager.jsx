// app/routes/passwortmanager.jsx
import { useLoaderData } from "@remix-run/react";
import { json, redirect, createCookieSessionStorage } from "@remix-run/node";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import PasswortManagerView from "../components/PasswortManagerView";

// ---------- Configuration ----------
const FILE_PATH = path.resolve("data/passwoerter.json");
const PIN_HASH  = "$2b$10$RrkhBESE3lXRaJHoI/gEy..."; // deine bestehende PIN-Hash

const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    secrets: ["sicheres-geheimes-wort"],
    sameSite: "lax",
    path: "/",
    httpOnly: true,
  },
});

// ---------- Loader ----------
export const loader = async ({ request }) => {
  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
  const erlaubt = session.get("freigeschaltet") === true;

  let eintraege = [];
  if (erlaubt && fs.existsSync(FILE_PATH)) {
    eintraege = JSON.parse(fs.readFileSync(FILE_PATH, "utf8"));
  }

  return json(
    { erlaubt, eintraege },
    { headers: { "Set-Cookie": await sessionStorage.commitSession(session) } }
  );
};

// ---------- Action ----------
export const action = async ({ request }) => {
  const form = await request.formData();
  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
  const typ = form.get("_action");

  // PIN-Freischaltung
  if (typ === "pin") {
    const pin     = form.get("pin");
    const korrekt = await bcrypt.compare(pin, PIN_HASH);
    if (korrekt) session.set("freigeschaltet", true);

    return redirect("/passwortmanager", {
      headers: { "Set-Cookie": await sessionStorage.commitSession(session) },
    });
  }

  // ohne Freischaltung zurück
  if (session.get("freigeschaltet") !== true) {
    return redirect("/passwortmanager");
  }

  // Einträge laden
  let daten = [];
  if (fs.existsSync(FILE_PATH)) {
    daten = JSON.parse(fs.readFileSync(FILE_PATH, "utf8"));
  }

  // HINZUFÜGEN
  if (typ === "hinzufuegen") {
    daten.push({
      website:      form.get("website"),
      benutzername: form.get("benutzername"),
      passwort:     form.get("passwort"),
      updatedAt:    new Date().toISOString(),
    });
  }

  // BEARBEITEN
  if (typ === "bearbeiten") {
    const index = parseInt(form.get("index"), 10);
    daten[index] = {
      website:      form.get("website"),
      benutzername: form.get("benutzername"),
      passwort:     form.get("passwort"),
      updatedAt:    new Date().toISOString(),
    };
  }

  // LÖSCHEN
  if (typ === "loeschen") {
    const index = parseInt(form.get("index"), 10);
    daten.splice(index, 1);
  }

  // zurückschreiben
  fs.writeFileSync(FILE_PATH, JSON.stringify(daten, null, 2));
  const commit = await sessionStorage.commitSession(session);

  // Beim Bearbeiten Query-Parameter, um Edit-Modus zu verlassen
  if (typ === "bearbeiten") {
    return redirect("/passwortmanager?bearbeitet=1", {
      headers: { "Set-Cookie": commit },
    });
  }

  return redirect("/passwortmanager", {
    headers: { "Set-Cookie": commit },
  });
};

// ---------- Route Component ----------
export default function PasswortManagerRoute() {
  const { erlaubt, eintraege } = useLoaderData();
  return <PasswortManagerView erlaubt={erlaubt} eintraege={eintraege} />;
}
