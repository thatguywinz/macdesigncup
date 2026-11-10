// One file, browser -> storage, with progress. Three steps:
//   1. ask the API for a ticket (it checks the slot, size and deadline)
//   2. send the bytes straight to storage (local: a PUT to this server;
//      deployed: Vercel Blob's presigned upload, never through our function)
//   3. tell the API it arrived; it checks the size and the first bytes and
//      only then attaches the file to the entry
import { api } from "./api";
import type { FileSlot } from "./shared/formats";
import type { OwnEntry } from "./shared/schema";

type Ticket =
  | { mode: "local"; url: string; pathname: string }
  | { mode: "blob"; pathname: string; handleUploadUrl: string; clientPayload: string };

export interface UploadOptions {
  entryId: string;
  editKey: string;
  slot: FileSlot;
  file: Blob;
  name: string;
  onProgress?: (fraction: number) => void;
  signal?: AbortSignal;
}

function putWithProgress(url: string, body: Blob, contentType: string, onProgress?: (f: number) => void, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.setRequestHeader("X-Portal", "1");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(e.loaded / e.total);
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(xhr.status === 413 ? "That file is too large." : `Upload failed (${xhr.status}).`)));
    xhr.onerror = () => reject(new Error("The upload was interrupted. Check the Wi-Fi and try again."));
    xhr.onabort = () => reject(new DOMException("Aborted", "AbortError"));
    signal?.addEventListener("abort", () => xhr.abort(), { once: true });
    xhr.send(body);
  });
}

export async function uploadFile(o: UploadOptions): Promise<OwnEntry> {
  const signed = await api<{ fileId: string; contentType: string; ticket: Ticket }>(`/entries/${o.entryId}/files`, {
    body: { slot: o.slot, name: o.name, size: o.file.size },
    editKey: o.editKey,
    signal: o.signal,
  });
  const { ticket } = signed;
  if (ticket.mode === "local") {
    await putWithProgress(ticket.url, o.file, signed.contentType, o.onProgress, o.signal);
  } else {
    // The SDK knows Blob's upload protocol (headers, retries, multipart for big files).
    const { uploadPresigned } = await import("@vercel/blob/client");
    await uploadPresigned(ticket.pathname, o.file, {
      access: "private",
      handleUploadUrl: ticket.handleUploadUrl,
      clientPayload: ticket.clientPayload,
      contentType: signed.contentType,
      multipart: o.file.size > 20 * 1024 * 1024,
      headers: { "X-Portal": "1" },
      abortSignal: o.signal,
      onUploadProgress: ({ percentage }) => o.onProgress?.(percentage / 100),
    });
  }
  o.onProgress?.(1);
  const done = await api<{ entry: OwnEntry }>(`/entries/${o.entryId}/files/${signed.fileId}/complete`, {
    body: {},
    editKey: o.editKey,
    signal: o.signal,
  });
  return done.entry;
}
