// src/components/cv/candidate/sectionscomponents/references/index.js
export { default as ReferenceForm } from './ReferenceForm';
export { default as ReferenceCard } from './ReferenceCard';
export { default as ReferencesEditor } from './ReferencesEditor';
export { default as AttachmentInput } from './AttachmentInput';

// API helpers para guardar/listar/eliminar referencias y manejar adjuntos
export {
  uploadReferenceFile,
  upsertReference,
  listReferencesByProfile,
  deleteReference,
  getAttachmentSignedUrl,
} from './referencesApi';