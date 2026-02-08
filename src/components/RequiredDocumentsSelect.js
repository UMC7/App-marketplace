import React from 'react';
import CustomMultiSelect from './CustomMultiSelect';

const RequiredDocumentsSelect = ({
  open,
  onToggle,
  selectedDocuments = [],
  onChange,
  requiredDocumentGroups = [],
  deckDocumentOptions = [],
  containerRef,
  name = 'required_documents',
}) => {
  const groups = React.useMemo(() => {
    if (!deckDocumentOptions || deckDocumentOptions.length === 0) {
      return requiredDocumentGroups;
    }
    const updated = [...requiredDocumentGroups];
    updated.splice(1, 0, {
      label: 'Radio Certificates',
      options: deckDocumentOptions,
    });
    return updated;
  }, [requiredDocumentGroups, deckDocumentOptions]);

  return (
    <CustomMultiSelect
      label="Required Documents / Certifications:"
      triggerId="required-docs-trigger"
      open={open}
      onToggle={onToggle}
      selected={selectedDocuments}
      renderSummary={(selected) =>
        selected.length > 0 ? selected.join(', ') : 'Select...'
      }
      groups={groups}
      name={name}
      onChange={onChange}
      containerRef={containerRef}
      caretSymbol="▾"
    />
  );
};

export default RequiredDocumentsSelect;
