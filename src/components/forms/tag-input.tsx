"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TagInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  maxItems?: number;
}

export function TagInput({ value, onChange, placeholder = "Type and press Enter", maxItems }: TagInputProps) {
  const [draft, setDraft] = useState("");

  const addTag = () => {
    const next = draft.trim();
    if (!next) {
      return;
    }
    if (maxItems && value.length >= maxItems) {
      return;
    }
    if (!value.includes(next)) {
      onChange([...value, next]);
    }
    setDraft("");
  };

  const removeTag = (item: string) => {
    onChange(value.filter((tag) => tag !== item));
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={draft}
          placeholder={placeholder}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addTag();
            }
          }}
        />
        <Button type="button" onClick={addTag} variant="outline">
          Add
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {value.map((item) => (
          <Badge key={item} className="gap-1">
            {item}
            <button type="button" onClick={() => removeTag(item)} aria-label={`Remove ${item}`}>
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
}
