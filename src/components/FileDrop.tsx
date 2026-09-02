import { useCallback, useRef, useState } from 'react';

interface FileDropProps {
  accept: string;
  onFile: (file: File) => void;
  label?: string;
  hint?: string;
}

export function FileDrop({ accept, onFile, label, hint }: FileDropProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      onFile(files[0]);
    },
    [onFile],
  );

  return (
    <div
      className={`dropzone${dragging ? ' dragging' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
    >
      <p>{label ?? 'Glissez-déposez votre fichier ici'}</p>
      <p>
        ou{' '}
        <label htmlFor="file-input">
          parcourir vos fichiers
        </label>
      </p>
      {hint && <p style={{ fontSize: '0.8rem' }}>{hint}</p>}
      <input
        id="file-input"
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
