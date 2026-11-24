"use client";

import React, { useEffect, useMemo, useRef } from "react";

interface ExamHtmlSurfaceProps {
  partKey: string;
  html: string;
  initialAnswers: Record<string, string>;
  onAnswersChange: (patch: Record<string, string>) => void;
}

/**
 * Memoized static HTML container for IELTS Listening & Reading exam parts.
 * Critical: prevents React from re-rendering dangerouslySetInnerHTML on every
 * answer keystroke/select change, so native <select>, <input>, radios,
 * data-group checkboxes, and drag-and-drop/tap-to-place .dpool/.dzone widgets
 * never lose focus or reset!
 */
const StaticExamMarkup = React.memo(function StaticExamMarkup({
  html,
  containerRef,
}: {
  html: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const markup = useMemo(() => ({ __html: html }), [html]);
  return (
    <div
      ref={containerRef}
      className="ielts-exam-html"
      dangerouslySetInnerHTML={markup}
    />
  );
});

export function ExamHtmlSurface({
  partKey,
  html,
  initialAnswers,
  onAnswersChange,
}: ExamHtmlSurfaceProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const onChangeRef = useRef(onAnswersChange);
  const selectedChipRef = useRef<{ value: string; label: string } | null>(null);

  useEffect(() => {
    onChangeRef.current = onAnswersChange;
  }, [onAnswersChange]);

  // Hydrate saved answers AND attach native DOM event listeners once per partKey
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    selectedChipRef.current = null;

    // Helper: lookup label text for a drag-pool value
    const findChipLabel = (val: string) => {
      const chip = root.querySelector<HTMLElement>(`.ditem[data-v="${CSS.escape(val)}"]`);
      return chip ? chip.textContent?.trim() || val : val;
    };

    const syncDragUsedStates = () => {
      const usedVals = new Set<string>();
      root.querySelectorAll<HTMLElement>(".dzone").forEach((z) => {
        const assigned = z.getAttribute("data-assigned");
        if (assigned) usedVals.add(assigned);
      });
      root.querySelectorAll<HTMLElement>(".ditem").forEach((chip) => {
        const v = chip.getAttribute("data-v") || "";
        chip.classList.toggle("is-used", usedVals.has(v));
      });
    };

    // 1. Hydrate text inputs, selects, radios
    root.querySelectorAll<HTMLInputElement | HTMLSelectElement>("input, select").forEach((el) => {
      const qNum = el.getAttribute("data-q");
      const groupAttr = el.getAttribute("data-group");

      if (el instanceof HTMLInputElement && el.type === "checkbox" && groupAttr) {
        const qs = groupAttr.split(",").map((s) => s.trim()).filter(Boolean);
        const chosen = qs.map((q) => initialAnswers[q]).filter(Boolean);
        el.checked = chosen.includes(el.value);
        return;
      }

      if (!qNum) return;
      const saved = initialAnswers[qNum] ?? "";
      if (el instanceof HTMLInputElement && el.type === "radio") {
        el.checked = saved === el.value;
      } else if (el instanceof HTMLInputElement && el.type === "checkbox") {
        const list = saved ? saved.split(",").filter(Boolean) : [];
        el.checked = list.includes(el.value);
      } else {
        el.value = saved;
      }
    });

    // 2. Hydrate drag/tap zones (.dzone)
    root.querySelectorAll<HTMLElement>(".dzone").forEach((zone) => {
      const qNum = zone.getAttribute("data-q");
      if (!qNum) return;
      const saved = initialAnswers[qNum] ?? "";
      const valEl = zone.querySelector<HTMLElement>(".dval");
      if (saved) {
        zone.setAttribute("data-assigned", saved);
        zone.classList.add("is-filled");
        if (valEl) valEl.textContent = findChipLabel(saved);
      } else {
        zone.removeAttribute("data-assigned");
        zone.classList.remove("is-filled");
        if (valEl) valEl.textContent = "";
      }
    });
    syncDragUsedStates();

    // 3. Delegated input / change handler
    const handleControlUpdate = (e: Event) => {
      const target = e.target as HTMLInputElement | HTMLSelectElement | null;
      if (!target) return;

      // Multi-question checkbox group (e.g. data-group="19,20" or "25,26,27")
      const groupAttr = target.getAttribute("data-group");
      if (target instanceof HTMLInputElement && target.type === "checkbox" && groupAttr) {
        const qs = groupAttr.split(",").map((s) => s.trim()).filter(Boolean);
        const allBoxes = Array.from(
          root.querySelectorAll<HTMLInputElement>(
            `input[type="checkbox"][data-group="${CSS.escape(groupAttr)}"]`
          )
        );
        const checkedBoxes = allBoxes.filter((b) => b.checked);
        // Prevent selecting more options than questions in this group
        if (checkedBoxes.length > qs.length) {
          target.checked = false;
          return;
        }
        const vals = checkedBoxes.map((b) => b.value).sort();
        const patch: Record<string, string> = {};
        qs.forEach((q, idx) => {
          patch[q] = vals[idx] || "";
        });
        onChangeRef.current(patch);
        return;
      }

      const qNum = target.getAttribute("data-q");
      if (!qNum) return;

      if (target instanceof HTMLInputElement && target.type === "checkbox") {
        const sameBoxes = Array.from(
          root.querySelectorAll<HTMLInputElement>(
            `input[type="checkbox"][data-q="${CSS.escape(qNum)}"]`
          )
        );
        const vals = sameBoxes.filter((b) => b.checked).map((b) => b.value).sort();
        onChangeRef.current({ [qNum]: vals.join(",") });
        return;
      }

      if (target instanceof HTMLInputElement && target.type === "radio") {
        if (target.checked) {
          onChangeRef.current({ [qNum]: target.value });
        }
        return;
      }

      onChangeRef.current({ [qNum]: target.value });
    };

    // 4. Drag & Drop + Tap-to-Assign handlers for .ditem / .dzone
    const assignToZone = (zone: HTMLElement, val: string, label: string) => {
      const qNum = zone.getAttribute("data-q");
      if (!qNum) return;
      const valEl = zone.querySelector<HTMLElement>(".dval");
      zone.setAttribute("data-assigned", val);
      zone.classList.add("is-filled");
      if (valEl) valEl.textContent = label;
      onChangeRef.current({ [qNum]: val });
      syncDragUsedStates();
    };

    const clearZone = (zone: HTMLElement) => {
      const qNum = zone.getAttribute("data-q");
      if (!qNum) return;
      const valEl = zone.querySelector<HTMLElement>(".dval");
      zone.removeAttribute("data-assigned");
      zone.classList.remove("is-filled");
      if (valEl) valEl.textContent = "";
      onChangeRef.current({ [qNum]: "" });
      syncDragUsedStates();
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const chip = target.closest<HTMLElement>(".ditem");
      if (chip) {
        const val = chip.getAttribute("data-v") || "";
        const label = chip.textContent?.trim() || val;
        const alreadySelected = selectedChipRef.current?.value === val;
        root.querySelectorAll(".ditem.is-selected").forEach((el) => el.classList.remove("is-selected"));
        if (alreadySelected) {
          selectedChipRef.current = null;
        } else {
          selectedChipRef.current = { value: val, label };
          chip.classList.add("is-selected");
        }
        return;
      }

      const zone = target.closest<HTMLElement>(".dzone");
      if (zone) {
        if (selectedChipRef.current) {
          assignToZone(zone, selectedChipRef.current.value, selectedChipRef.current.label);
          selectedChipRef.current = null;
          root.querySelectorAll(".ditem.is-selected").forEach((el) => el.classList.remove("is-selected"));
        } else if (zone.getAttribute("data-assigned")) {
          clearZone(zone);
        }
      }
    };

    const handleDragStart = (e: DragEvent) => {
      const chip = (e.target as HTMLElement | null)?.closest<HTMLElement>(".ditem");
      if (!chip || !e.dataTransfer) return;
      const val = chip.getAttribute("data-v") || "";
      const label = chip.textContent?.trim() || val;
      e.dataTransfer.setData("text/plain", JSON.stringify({ val, label }));
      e.dataTransfer.effectAllowed = "copy";
    };

    const handleDragOver = (e: DragEvent) => {
      const zone = (e.target as HTMLElement | null)?.closest<HTMLElement>(".dzone");
      if (!zone) return;
      e.preventDefault();
      zone.classList.add("is-over");
    };

    const handleDragLeave = (e: DragEvent) => {
      const zone = (e.target as HTMLElement | null)?.closest<HTMLElement>(".dzone");
      zone?.classList.remove("is-over");
    };

    const handleDrop = (e: DragEvent) => {
      const zone = (e.target as HTMLElement | null)?.closest<HTMLElement>(".dzone");
      if (!zone || !e.dataTransfer) return;
      e.preventDefault();
      zone.classList.remove("is-over");
      try {
        const parsed = JSON.parse(e.dataTransfer.getData("text/plain")) as {
          val: string;
          label: string;
        };
        if (parsed.val) assignToZone(zone, parsed.val, parsed.label);
      } catch {
        // Ignore malformed drop payload
      }
    };

    root.addEventListener("input", handleControlUpdate);
    root.addEventListener("change", handleControlUpdate);
    root.addEventListener("click", handleClick);
    root.addEventListener("dragstart", handleDragStart);
    root.addEventListener("dragover", handleDragOver);
    root.addEventListener("dragleave", handleDragLeave);
    root.addEventListener("drop", handleDrop);

    return () => {
      root.removeEventListener("input", handleControlUpdate);
      root.removeEventListener("change", handleControlUpdate);
      root.removeEventListener("click", handleClick);
      root.removeEventListener("dragstart", handleDragStart);
      root.removeEventListener("dragover", handleDragOver);
      root.removeEventListener("dragleave", handleDragLeave);
      root.removeEventListener("drop", handleDrop);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partKey, html]);

  return <StaticExamMarkup key={partKey} html={html} containerRef={containerRef} />;
}
