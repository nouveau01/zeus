"use client";

import { useState, useCallback } from "react";
import GridLayout, { Layout } from "react-grid-layout";
import { PageLayout, SectionDefinition } from "./types";
import SectionRenderer from "./SectionRenderer";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

interface PageBuilderProps {
  layout: PageLayout;
  data: Record<string, any>;
  onChange: (field: string, value: any) => void;
  isEditMode?: boolean;
  onLayoutChange?: (newLayout: PageLayout) => void;
  width?: number;
  disabled?: boolean;
}

export default function PageBuilder({
  layout,
  data,
  onChange,
  isEditMode = false,
  onLayoutChange,
  width = 900,
  disabled = false,
}: PageBuilderProps) {
  const gridCols = layout.gridCols || 12;
  const rowHeight = layout.rowHeight || 30;

  // Convert sections to react-grid-layout format
  const gridLayouts: Layout[] = layout.sections.map((section) => ({
    i: section.id,
    x: section.layout.x,
    y: section.layout.y,
    w: section.layout.w,
    h: section.layout.h,
    minW: section.layout.minW || 2,
    minH: section.layout.minH || 2,
    static: !isEditMode,
  }));

  // Handle layout changes from drag/resize
  const handleLayoutChange = useCallback(
    (newGridLayout: Layout[]) => {
      if (!isEditMode || !onLayoutChange) return;

      // Update section layouts with new positions/sizes
      const updatedSections = layout.sections.map((section) => {
        const gridItem = newGridLayout.find((item) => item.i === section.id);
        if (gridItem) {
          return {
            ...section,
            layout: {
              ...section.layout,
              x: gridItem.x,
              y: gridItem.y,
              w: gridItem.w,
              h: gridItem.h,
            },
          };
        }
        return section;
      });

      onLayoutChange({
        ...layout,
        sections: updatedSections,
      });
    },
    [isEditMode, layout, onLayoutChange]
  );

  return (
    <div className="relative">
      {isEditMode && (
        <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-bl z-50">
          Edit Mode - Drag & Resize Sections
        </div>
      )}
      <GridLayout
        className="layout"
        layout={gridLayouts}
        cols={gridCols}
        rowHeight={rowHeight}
        width={width}
        onLayoutChange={handleLayoutChange}
        isDraggable={isEditMode}
        isResizable={isEditMode}
        compactType={null}
        preventCollision={false}
        margin={[4, 4]}
        containerPadding={[0, 0]}
      >
        {layout.sections.map((section) => (
          <div
            key={section.id}
            className={`${
              isEditMode
                ? "border-2 border-dashed border-blue-300 hover:border-blue-500"
                : ""
            }`}
          >
            {isEditMode && (
              <div className="absolute top-0 left-0 bg-blue-100 text-blue-700 text-[9px] px-1 rounded-br z-10">
                {section.title || section.id}
              </div>
            )}
            <SectionRenderer
              section={section}
              data={data}
              onChange={onChange}
              disabled={disabled}
            />
          </div>
        ))}
      </GridLayout>
    </div>
  );
}
