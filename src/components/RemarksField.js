// src/components/RemarksField.js

import React from 'react';

function RemarksField({
  value,
  onChange,
  onInput,
  onFocus,
  textareaRef,
  previousRemarks,
  remarksAiUsed,
  remarksTyping,
  rewriteLoading,
  onUndo,
  onImprove,
}) {
  return (
    <>
      <label>Remarks:</label>
      <div className="remarks-field">
        <textarea
          className="remarks-textarea"
          name="description"
          rows={5}
          ref={textareaRef}
          value={value}
          onChange={onChange}
          onInput={onInput}
          onFocus={onFocus}
          style={{ overflow: 'hidden', resize: 'none' }}
        />
        <button
          type="button"
          onClick={previousRemarks ? onUndo : onImprove}
          className="remarks-ai-button"
          disabled={rewriteLoading || (!previousRemarks && remarksAiUsed)}
          aria-label={previousRemarks ? 'Undo AI change' : 'Improve with AI'}
          title={previousRemarks ? 'Undo' : 'Improve with AI'}
          data-typing={remarksTyping ? 'true' : 'false'}
        >
          {rewriteLoading ? (
            <span className="remarks-ai-text">...</span>
          ) : previousRemarks ? (
            <span className="remarks-ai-text">Undo</span>
          ) : (
            <>
              <span className="remarks-ai-spark">✦</span>
              <span className="remarks-ai-text">AI</span>
            </>
          )}
        </button>
      </div>
    </>
  );
}

export default RemarksField;