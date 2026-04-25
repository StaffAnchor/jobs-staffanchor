"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { skillOptionGroups } from "@/modules/shared/skill-options";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface SelectedSkillValue {
  name: string;
  category: string;
  isCore: boolean;
}

interface SearchableSkillPickerProps {
  value: SelectedSkillValue[];
  onChange: (next: SelectedSkillValue[]) => void;
  maxCoreSkills?: number;
}

export function SearchableSkillPicker({ value, onChange, maxCoreSkills = 5 }: SearchableSkillPickerProps) {
  const [query, setQuery] = useState("");

  const trimmedQuery = query.trim();
  const normalizedQuery = trimmedQuery.toLowerCase();
  const shouldShowDropdown = normalizedQuery.length > 0;

  const filteredGroups = useMemo(() => {
    return skillOptionGroups
      .map((group) => ({
        ...group,
        skills: group.skills.filter((skill) => {
          if (!normalizedQuery) {
            return true;
          }

          return (
            skill.toLowerCase().includes(normalizedQuery) ||
            group.category.toLowerCase().includes(normalizedQuery)
          );
        }),
      }))
      .filter((group) => group.skills.length > 0);
  }, [normalizedQuery]);

  const addSkill = (name: string, category: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return;
    }

    if (value.some((item) => item.name.toLowerCase() === trimmedName.toLowerCase())) {
      return;
    }

    onChange([...value, { name: trimmedName, category, isCore: false }]);
    setQuery("");
  };

  const removeSkill = (name: string) => {
    onChange(value.filter((item) => item.name !== name));
  };

  const toggleCore = (name: string, checked: boolean) => {
    const currentCoreCount = value.filter((item) => item.isCore).length;
    const next = value.map((item) => {
      if (item.name !== name) {
        return item;
      }

      return { ...item, isCore: checked };
    });

    if (checked && currentCoreCount >= maxCoreSkills) {
      return;
    }

    onChange(next);
  };

  const hasExactSkillMatch = useMemo(
    () =>
      skillOptionGroups.some((group) =>
        group.skills.some((skill) => skill.toLowerCase() === normalizedQuery)
      ),
    [normalizedQuery]
  );

  const hasTypedSkillAlreadySelected = value.some(
    (item) => item.name.toLowerCase() === normalizedQuery
  );

  const canAddCustomSkill =
    shouldShowDropdown &&
    normalizedQuery.length >= 2 &&
    !hasExactSkillMatch &&
    !hasTypedSkillAlreadySelected;

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-slate-700">Skills</p>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          className="pl-9"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && canAddCustomSkill) {
              event.preventDefault();
              addSkill(trimmedQuery, "Custom");
            }
          }}
          placeholder="Search skills by keyword or category"
        />
      </div>

      {shouldShowDropdown ? (
        <div className="max-h-72 space-y-3 overflow-auto rounded-lg border border-slate-200 bg-white p-3">
          {filteredGroups.length === 0 ? (
            <p className="text-sm text-slate-500">No matching skills found.</p>
          ) : (
            filteredGroups.map((group) => (
              <div key={group.category} className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{group.category}</p>
                <div className="flex flex-wrap gap-2">
                  {group.skills.map((skill) => {
                    const isSelected = value.some((item) => item.name === skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => addSkill(skill, group.category)}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-left text-xs transition",
                          isSelected
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100"
                        )}
                      >
                        {skill}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}

          {canAddCustomSkill ? (
            <div className="border-t border-slate-200 pt-3">
              <Button type="button" variant="outline" onClick={() => addSkill(trimmedQuery, "Custom")}> 
                Add "{trimmedQuery}" as a custom skill
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {value.map((item) => (
          <div
            key={item.name}
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs text-slate-700"
          >
            <span>{item.name}</span>
            <label className="flex items-center gap-1 text-slate-600">
              <input
                type="checkbox"
                checked={item.isCore}
                onChange={(event) => toggleCore(item.name, event.target.checked)}
              />
              Core
            </label>
            <Button type="button" variant="ghost" className="h-6 w-6 rounded-full p-0" onClick={() => removeSkill(item.name)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
