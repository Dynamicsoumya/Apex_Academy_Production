import React, { useEffect, useState } from "react";
import API from "../api/api";
import { mediaUrl } from "../utils/mediaUrl";

export default function AdminPaymentQrSettings({ canEdit = false }) {
  const [settings, setSettings] = useState({
    upiId: "",
    payeeName: "Apex Academy",
    phonePeQrUrl: "",
    googlePayQrUrl: "",
  });
  const [phonePeFile, setPhonePeFile] = useState(null);
  const [googlePayFile, setGooglePayFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [open, setOpen] = useState(false);

  const load = () => {
    setLoading(true);
    API.get("/admissions/payment-settings")
      .then((res) => setSettings(res.data))
      .catch(() => setMsg("Could not load payment QR settings"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!canEdit) return;
    setSaving(true);
    setMsg("");
    try {
      const fd = new FormData();
      fd.append("upiId", settings.upiId || "");
      fd.append("payeeName", settings.payeeName || "Apex Academy");
      if (phonePeFile) fd.append("phonePeQr", phonePeFile);
      if (googlePayFile) fd.append("googlePayQr", googlePayFile);

      const { data } = await API.put("/admissions/payment-settings", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSettings(data);
      setPhonePeFile(null);
      setGooglePayFile(null);
      setMsg("Payment QR settings saved!");
    } catch (err) {
      setMsg(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="adm-qr-settings">
      <button type="button" className="adm-qr-settings-toggle" onClick={() => setOpen(!open)}>
        <span>📱</span>
        <div>
          <strong>UPI QR codes (PhonePe / Google Pay)</strong>
          <small>
            {canEdit
              ? "Students scan these to pay admission fee offline"
              : "View only — only super admin can edit payment settings"}
          </small>
        </div>
        <span className="adm-qr-settings-chevron">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <form className="adm-qr-settings-form" onSubmit={handleSave}>
          {loading ? (
            <p>Loading…</p>
          ) : (
            <>
              {msg && <p className={`adm-modal-msg ${msg.includes("fail") || msg.includes("Could") ? "error" : ""}`}>{msg}</p>}

              <div className="adm-qr-settings-row">
                <label>
                  UPI ID
                  <input
                    value={settings.upiId || ""}
                    onChange={(e) => setSettings({ ...settings, upiId: e.target.value })}
                    placeholder="apexacademy@ybl"
                    readOnly={!canEdit}
                  />
                </label>
                <label>
                  Payee name
                  <input
                    value={settings.payeeName || ""}
                    onChange={(e) => setSettings({ ...settings, payeeName: e.target.value })}
                    placeholder="Apex Academy"
                    readOnly={!canEdit}
                  />
                </label>
              </div>

              <div className="adm-qr-settings-uploads">
                <div className="adm-qr-settings-upload">
                  <p>PhonePe QR</p>
                  {settings.phonePeQrUrl && (
                    <img src={mediaUrl(settings.phonePeQrUrl)} alt="PhonePe QR" className="adm-qr-settings-preview" />
                  )}
                  {canEdit && (
                    <label className="btn btn-outline btn-sm">
                      {settings.phonePeQrUrl ? "Replace QR" : "Upload QR"}
                      <input type="file" accept="image/*" hidden onChange={(e) => setPhonePeFile(e.target.files?.[0] || null)} />
                    </label>
                  )}
                  {phonePeFile && <small>{phonePeFile.name}</small>}
                </div>

                <div className="adm-qr-settings-upload">
                  <p>Google Pay QR</p>
                  {settings.googlePayQrUrl && (
                    <img src={mediaUrl(settings.googlePayQrUrl)} alt="Google Pay QR" className="adm-qr-settings-preview" />
                  )}
                  {canEdit && (
                    <label className="btn btn-outline btn-sm">
                      {settings.googlePayQrUrl ? "Replace QR" : "Upload QR"}
                      <input type="file" accept="image/*" hidden onChange={(e) => setGooglePayFile(e.target.files?.[0] || null)} />
                    </label>
                  )}
                  {googlePayFile && <small>{googlePayFile.name}</small>}
                </div>
              </div>

              {canEdit ? (
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Saving…" : "Save QR settings"}
                </button>
              ) : (
                <p className="adm-qr-readonly-note">Contact super admin to update UPI ID or QR codes.</p>
              )}
            </>
          )}
        </form>
      )}
    </div>
  );
}
