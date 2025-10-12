// src/components/cv/candidate/sectionscomponents/documents/documentssectioncontroller/docmanager/doclist/DocList.js
import React from "react";
import DocMetadataForm from "./DocMetadataForm";
import DocCard from "./doccard/DocCard";

export default function DocList({
  docs = [],
  mode = "edit",
  onChangeDoc,
  onRemoveDoc,
  onPreview,
  onDownload,
}) {
  if (!Array.isArray(docs) || docs.length === 0) {
    return (
      <div className="doc-manager__empty">
        <p>No documents yet.</p>
      </div>
    );
  }

  if (mode === "compact") {
    return (
      <ul className="doc-list doc-list--compact">
        {docs.map((d) => (
          <li key={d.id} className="doc-item doc-item--compact">
            <DocCard
              doc={d}
              onPreview={onPreview}
              onDownload={onDownload}
              rightSlot={null}
            />
          </li>
        ))}
      </ul>
    );
  }

  // Default: editable forms list
  return (
    <ul className="doc-list">
      {docs.map((d) => (
        <li key={d.id} className="doc-item">
          <DocMetadataForm
            doc={d}
            onChange={(patch) => onChangeDoc && onChangeDoc(d.id, patch)}
            onRemove={onRemoveDoc ? () => onRemoveDoc(d.id) : undefined}
          />
        </li>
      ))}
    </ul>
  );
}