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
    const hasRadioGroup = requiredDocumentGroups.some(
      (group) => group?.label === 'Radio Certificates'
    );
    if (hasRadioGroup) {
      return requiredDocumentGroups;
    }
    if (
      deckDocumentOptions.length === 1 &&
      deckDocumentOptions[0] === 'VHF SRC' &&
      requiredDocumentGroups.some(
        (group) =>
          group?.label === 'Radio Certificates' &&
          Array.isArray(group.options) &&
          group.options.some((opt) => opt === 'GMDSS GOC' || opt === 'GMDSS ROC')
      )
    ) {
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
