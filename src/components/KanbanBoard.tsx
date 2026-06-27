/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Issue, IssueStatus, IssueSeverity } from "../types";

export interface KanbanColumn {
  id: string;
  title: string;
  colorTag: string;
  statuses: IssueStatus[];
}

export interface KanbanBoardProps {
  filteredQueue: Issue[];
  kanbanColumns: KanbanColumn[];
  onCardClick: (issueId: string) => void;
  renderCardActions?: (item: Issue) => React.ReactNode;
  showAddress?: boolean;
  showDescription?: boolean;
  splitCategory?: boolean;
}

export default function KanbanBoard({
  filteredQueue,
  kanbanColumns,
  onCardClick,
  renderCardActions,
  showAddress = false,
  showDescription = false,
  splitCategory = false,
}: KanbanBoardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start select-none">
      {kanbanColumns.map((col) => {
        const ColumnTickets = filteredQueue.filter((x) => col.statuses.includes(x.status));

        return (
          <div
            key={col.id}
            className="bg-theme-secondary border border-theme-main rounded-2xl p-4 flex flex-col h-[70vh] min-h-[480px]"
          >
            <div className={`p-3 rounded-xl border flex justify-between items-center mb-3 ${col.colorTag}`}>
              <span className="text-xs font-bold uppercase tracking-wider">{col.title}</span>
              <span className="text-xs font-mono font-extrabold shrink-0">{ColumnTickets.length}</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {ColumnTickets.length === 0 ? (
                <div className="p-8 text-center text-xs text-theme-muted italic mt-8 bg-theme-tertiary/10 border border-dashed border-theme-main rounded-2xl">
                  No cases in stage
                </div>
              ) : (
                ColumnTickets.map((item) => {
                  const listColor =
                    item.severity === IssueSeverity.CRITICAL
                      ? "border-l-4 border-l-red-500"
                      : item.severity === IssueSeverity.HIGH
                      ? "border-l-3 border-l-orange-500"
                      : "border-l-2 border-l-slate-700";

                  const categoryText = splitCategory ? item.category.split(" ")[0] : item.category;

                  return (
                    <div
                      key={item.id}
                      onClick={() => onCardClick(item.id)}
                      className={`bg-theme-tertiary border border-theme-main/80 rounded-xl p-3.5 hover:border-theme-muted/50 transition cursor-pointer text-left relative group shadow-sm ${listColor}`}
                      id={`kanban-card-${item.id}`}
                    >
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <span className="text-[9px] font-mono font-bold text-theme-muted bg-theme-secondary px-1.5 py-0.5 rounded leading-none">
                          {item.id}
                        </span>
                        <span className="text-[9px] font-mono text-[#21D4FD] bg-[#21D4FD]/10 rounded-full px-2 py-0.5 leading-none font-bold uppercase truncate max-w-[120px]">
                          {categoryText}
                        </span>
                      </div>

                      <h4 className="text-xs font-extrabold text-theme-main line-clamp-2 leading-snug">
                        {item.title}
                      </h4>

                      {showDescription && item.originalDescription && (
                        <p className="text-[11px] text-theme-muted mt-1 leading-normal line-clamp-2">
                          {item.originalDescription}
                        </p>
                      )}

                      {showAddress && item.address && (
                        <p className="text-[10px] text-theme-muted mt-1 line-clamp-1 italic">
                          📍 {item.address.split(",")[0]}
                        </p>
                      )}

                      <div className="mt-4 pt-3 border-t border-theme-main flex justify-between items-center">
                        <div className="text-left">
                          <p className="text-[8px] font-mono text-theme-muted uppercase leading-none">Priority Grade</p>
                          <p className="text-xs font-bold text-theme-main font-mono mt-1">
                            {Math.round(item.priorityScore)}/100
                          </p>
                        </div>

                        {renderCardActions && renderCardActions(item)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
