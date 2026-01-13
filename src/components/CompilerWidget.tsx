// src/components/CompilerWidget.tsx
import React, { memo, useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Handle, Position, useReactFlow, NodeProps } from '@xyflow/react';
import { FileExplorer } from './FileExplorer';
import { MonacoEditorWrapper } from './MonacoEditorWrapper';
import { OutputPanel } from './OutputPanel';
import cls from './CompilerWidget.module.scss';
import { useCompiler } from '../hooks/useCompiler';

import { Shield, SquarePen, X } from "lucide-react";

import type { EditorDocument } from '../types/EditorDocument';
import { RunContainer } from "./RunContainer.tsx";

const files = {
    "ConsoleApp.csproj":
        '<Project Sdk="Microsoft.NET.Sdk">\n  <PropertyGroup>\n    <OutputType>Exe</OutputType>\n    <TargetFramework>net9.0</TargetFramework>\n  </PropertyGroup>\n</Project>',
    "Program.cs":
        'using System;\n\nnamespace ConsoleApp\n{\n    class Program\n    {\n        static void Main(string[] args)\n        {\n            Console.WriteLine("Hello from compiled C#!");\n            Console.WriteLine($"Current time: {DateTime.Now}");\n        }\n    }\n}'
}

const CompilerWidget: React.FC<NodeProps> = ({ data }) => {
    const [widgetId] = useState<number>(data.backendId as number);

    const {
        documents,
        selectedDocument,
        selectedId,
        setSelectedId,
        setDocumentContent,
        addDocument,
        deleteDocument,
        iaScazalaStartuem,
        updateOneDocPath,
        updateDocument,
        updateDocPath,
        updatePath,
        output,
        history,
        run,
        stop,
        saveAll
    } = useCompiler(widgetId, files);

    const rf = useReactFlow();
    const maybeUpdateNodeDimensions = (nodeId: number) => {
        if (rf && typeof (rf as any).updateNodeDimensions === 'function') {
            try {
                (rf as any).updateNodeDimensions(nodeId);
            } catch {
            }
        }
    };

    useEffect(() => {
        const model = {
            widgetId: widgetId.toString(),
            userId: 123,
            board: {
                id: 123,
                name: 'asd',
                parentId: 132
            },
            config: "",
            role: "ads"
        }
        iaScazalaStartuem(model);
    }, [widgetId]);

    useEffect(() => {
        console.log(widgetId)
    }, [widgetId])

    const currentDocument: EditorDocument | null = selectedDocument ?? (documents[0] ?? null);
    const currentCode = currentDocument?.content ?? '';
    const currentLanguage = 'csharp';

    // panel widths
    const [leftWidth, setLeftWidth] = useState(180);
    const [rightWidth, setRightWidth] = useState(220);

    const [collapsed, setCollapsed] = useState(false);

    const handleCodeChange = (newCode: string) => {
        if (currentDocument) {
            setDocumentContent(currentDocument.id, newCode);
        }
    };

    // Обработчик переименования файла
    const handleRename = (id: string, newName: string) => {
        const doc = documents.find(d => d.id === id);
        if (!doc || newName === doc.name) return;

        updateDocument(id, {
            name: newName
        });
    };

    const changeAllDocPath = (oldPath: string, newPath: string) => {
        updatePath(widgetId, oldPath, newPath);
    }

    const handleRepath = (id: string, oldPath: string, newPath: string) => {
        const doc = documents.find(d => d.id === id);
        updateOneDocPath(id, newPath)
        if (!doc || newPath === doc.path) return;

    };

    const containerRef = useRef<HTMLDivElement | null>(null);
    const resizeObserverRef = useRef<ResizeObserver | null>(null);

    useLayoutEffect(() => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        maybeUpdateNodeDimensions(widgetId);

        const ro = new ResizeObserver((entries) => {
            for (const entry of entries) {
                if (entry.target === containerRef.current) {
                    maybeUpdateNodeDimensions(widgetId);
                }
            }
        });

        resizeObserverRef.current = ro;
        ro.observe(containerRef.current);

        return () => {
            ro.disconnect();
            resizeObserverRef.current = null;
        };
    }, [widgetId, collapsed]);

    useEffect(() => {
        if (!containerRef.current) return;
        maybeUpdateNodeDimensions(widgetId);
    }, [collapsed]);

    const toggleCollapsed = () => setCollapsed(prev => !prev);

    const startResizing = (
        e: React.MouseEvent,
        setter: (v: number) => void,
        startWidth: number,
        direction: "left" | "right",
        min = 120,
        max = 1000
    ) => {
        e.preventDefault();
        e.stopPropagation();

        const startX = e.clientX;

        const onMove = (ev: MouseEvent) => {
            const dx = ev.clientX - startX;
            const newWidth = direction === "left" ? startWidth + dx : startWidth - dx;
            setter(Math.min(Math.max(newWidth, min), max));
        };

        const onUp = () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    };

    const handleMoveFile = (fileId: string, newPath: string) => {
        updateDocPath(fileId, newPath);
    };


    return (
        <div
            ref={containerRef}
            className={`${cls.widget} ${collapsed ? cls.collapsed : ''}`}
        >
            <Handle type="target" position={Position.Top} />

            {/* GLOBAL NodeResizer (xyflow) — виден только если не collapsed */}

            {/* HEADER */}
            <div className="drag-handle__custom">
                <div className={cls.header}>
                    <h4>Code Block</h4>

                    <div className={cls.shieldContainer}>
                        <Shield className={cls.shield} />
                        <SquarePen className={cls.badge} />
                    </div>

                    <button className={cls.closeButton} onClick={toggleCollapsed}>
                        {collapsed ? (
                            <svg width="16" height="16" viewBox="0 0 16 16">
                                <path d="M4 8h8M8 4v8" stroke="currentColor" strokeWidth="2" />
                            </svg>
                        ) : (
                            <X className={cls.close} />
                        )}
                    </button>
                </div>
            </div>

            {/* BODY */}
            {!collapsed && (
                <div className={cls.body}>
                    {/* LEFT PANEL */}
                    <div className={cls.panel} style={{ width: leftWidth }}>
                        <FileExplorer
                            key={documents.length}
                            documents={documents}
                            selectedId={selectedId}
                            onSelect={setSelectedId}
                            onAdd={addDocument}
                            onRename={handleRename} // Используем inline-редактирование
                            onDelete={deleteDocument}
                            onMove={handleMoveFile}
                            onFolderRename={handleRepath}
                            changeAllDocPath={changeAllDocPath}
                        />

                        <div
                            className={cls.resizer}
                            onMouseDown={(e) =>
                                startResizing(e, setLeftWidth, leftWidth, "left")
                            }
                        />
                    </div>

                    {/* CENTER */}
                    <div className={cls.centerPanel}>
                        {currentDocument ? (
                            <div className={cls.editCont}>
                                <MonacoEditorWrapper
                                    code={currentCode}
                                    language={currentLanguage}
                                    onChange={handleCodeChange}
                                    theme="vs-light"
                                />
                                <RunContainer run={run} stop={stop} save={saveAll} />
                            </div>
                        ) : (
                            <div style={{ padding: 16, color: '#666' }}>
                                Нет открытого документа
                            </div>
                        )}
                    </div>

                    {/* RIGHT */}
                    <div className={cls.panel} style={{ width: rightWidth }}>
                        <OutputPanel output={output} history={history} />

                        <div
                            className={cls.resizer}
                            onMouseDown={(e) =>
                                startResizing(e, setRightWidth, rightWidth, "right")
                            }
                        />
                    </div>
                </div>
            )}

            <Handle type="source" position={Position.Bottom} />
        </div>
    );
};

export default memo(CompilerWidget);