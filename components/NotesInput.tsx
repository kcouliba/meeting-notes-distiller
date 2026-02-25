"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Upload } from "lucide-react";
import { parseTranscriptFile, isFileParseError } from "@/lib/parsers";

const MAX_CHARS = 50000;

interface NotesInputProps {
  onSubmit: (notes: string) => void;
  isLoading: boolean;
  notes: string;
  onNotesChange: (notes: string) => void;
}

export function NotesInput({ onSubmit, isLoading, notes, onNotesChange }: NotesInputProps) {
  const [dragActive, setDragActive] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileErrorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const charCount = notes.length;
  const isOverLimit = charCount > MAX_CHARS;
  const isEmpty = notes.trim().length === 0;
  const isDisabled = isEmpty || isOverLimit || isLoading;

  // Clear file error after 5 seconds
  useEffect(() => {
    if (fileError) {
      fileErrorTimerRef.current = setTimeout(() => {
        setFileError(null);
      }, 5000);
      return () => {
        if (fileErrorTimerRef.current) {
          clearTimeout(fileErrorTimerRef.current);
        }
      };
    }
  }, [fileError]);

  const handleFile = useCallback(async (file: File) => {
    const result = await parseTranscriptFile(file);

    if (isFileParseError(result)) {
      setFileError(result.message);
      return;
    }

    setFileError(null);
    let text = result.text;

    if (text.length > MAX_CHARS) {
      text = text.slice(0, MAX_CHARS);
      setFileError("File content was truncated to 50,000 characters.");
    }

    onNotesChange(text);
  }, [onNotesChange]);

  function handleSubmit() {
    if (!isDisabled) {
      onSubmit(notes);
    }
  }

  function handleClear() {
    onNotesChange("");
  }

  function handleNotesChange(value: string) {
    onNotesChange(value);
    // Clear file error when user types
    if (fileError) {
      setFileError(null);
    }
  }

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoading) {
      setDragActive(true);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    // Only deactivate if leaving the container (not entering a child)
    const rect = e.currentTarget.getBoundingClientRect();
    const { clientX, clientY } = e;
    if (
      clientX <= rect.left ||
      clientX >= rect.right ||
      clientY <= rect.top ||
      clientY >= rect.bottom
    ) {
      setDragActive(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (isLoading) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
    // Reset the input so the same file can be re-selected
    e.target.value = "";
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div
        className="relative"
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Textarea
          placeholder="Paste your meeting notes here... (raw notes, transcriptions from Zoom/Teams/Otter, bullet points or paragraphs)"
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          onPaste={(e) => {
            const pasted = e.clipboardData.getData("text");
            if (pasted) {
              e.preventDefault();
              const target = e.target as HTMLTextAreaElement;
              const start = target.selectionStart;
              const end = target.selectionEnd;
              const newValue =
                notes.slice(0, start) + pasted + notes.slice(end);
              handleNotesChange(newValue);
            }
          }}
          className="min-h-[200px] flex-1 resize-y text-sm leading-relaxed"
          disabled={isLoading}
        />

        {/* Drop zone overlay */}
        {dragActive && (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center rounded-md border-2 border-dashed border-indigo-500 bg-indigo-500/10"
            aria-live="polite"
          >
            <div className="flex flex-col items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <Upload className="h-8 w-8" />
              <p className="text-sm font-medium">
                Drop your transcript file here
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Supported formats hint - visible only when textarea is empty */}
      {isEmpty && (
        <p className="text-xs text-muted-foreground">
          Supports .vtt, .srt, and .txt files (max 500 KB)
        </p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <span
            className={`text-sm tabular-nums ${
              isOverLimit
                ? "text-red-500 font-medium"
                : charCount > MAX_CHARS * 0.9
                  ? "text-amber-500"
                  : "text-muted-foreground"
            }`}
          >
            {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()}{" "}
            characters
          </span>

          {/* File error display */}
          {fileError && (
            <p className="text-sm text-red-500" role="alert">
              {fileError}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleClear}
            disabled={isEmpty || isLoading}
          >
            Clear
          </Button>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload File
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".vtt,.srt,.txt"
            onChange={handleFileInputChange}
            className="hidden"
            aria-label="Upload transcript file"
          />
          <Button
            onClick={handleSubmit}
            disabled={isDisabled}
            className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[120px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Distilling...
              </>
            ) : (
              "Distill"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
