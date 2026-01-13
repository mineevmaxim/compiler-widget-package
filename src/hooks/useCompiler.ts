import { useEffect, useState } from "react";
import type { EditorDocument } from "../types/EditorDocument";
import { FileApi, ProjectApi, CompilerApi, type CompilationError } from "../api";

interface GetInfoModelDto {
    widgetId: string,
    userId: number,
    role: string,
    config: string,
    board: {
        id: number,
        name: string,
        parentId: number
    }
}

export function useCompiler(id: number, initialFiles?: Record<string, string>) {

    const [isInitialized, setIsInitialized] = useState<boolean>(false);
    const [needToCreateFiles, setNeedToCreateFiles] = useState<boolean>(true);

    const [projectId, setProjectId] = useState<number>(id);
    const [output, setOutput] = useState<string>("");

    const fileApi = new FileApi();
    const compilerApi = new CompilerApi();

    const [documents, setDocuments] = useState<EditorDocument[]>([]);

    useEffect(() => {
        if (projectId && initialFiles && !isInitialized && needToCreateFiles) {
            setDocuments([]);
            console.log("работаем с файлами");

            Object.keys(initialFiles).forEach(key => {
                fileApi.apiFilesProjectProjectIdPost(projectId, {
                    name: key,
                    path: key
                }).then(res => {
                    console.log(res);

                    const file: EditorDocument = {
                        id: res.data,
                        content: initialFiles[key],
                        language: "csharp",
                        modified: false,
                        name: key,
                        path: key
                    };

                    fileApi.apiFilesFileIdSavePost(file.id, {
                        content: initialFiles[key],
                    }).then(res => {
                        setNeedToCreateFiles(false);
                    })
                })
            });
        }
    }, [projectId, initialFiles, needToCreateFiles]);

    useEffect(() => {
        if (projectId && !isInitialized && !needToCreateFiles) {
            setDocuments([]);
            fileApi.apiFilesProjectIdGet(projectId)
                .then((files) => {
                    files.data.forEach(file => {
                        fileApi.apiFilesReadFileIdGet(file.fileId!).then(res => {
                            const document: EditorDocument = {
                                id: file.fileId!,
                                content: res.data,
                                language: "csharp",
                                modified: false,
                                name: file.fileName!,
                                path: file.path!
                            };
                            setDocuments(docs => [...docs, document]);
                        })
                            .finally(() => {
                                setIsInitialized(true)
                            });
                    });
                })

        }
    }, [projectId, initialFiles, needToCreateFiles]);

    const [selectedId, setSelectedId] = useState<string | null>(
        () => documents[0]?.id || null
    );

    const selectedDocument = documents.find(d => d.id === selectedId) || null;

    const setDocumentContent = (id: string, newContent: string) => {
        setDocuments(docs =>
            docs.map(d =>
                d.id === id
                    ? { ...d, content: newContent, modified: true }
                    : d
            )
        );
    };

    //АХАХАХАХАХАХАХАХАХАХАХАХАХАХ
    const iaScazalaStartuem = (model: GetInfoModelDto) => {
        try {
            const api = new ProjectApi();
            api.apiProjectsGetOrCreateProjectIdPost(model.widgetId.toString())
                .then((res) => {

                    if (res.status === 201) setNeedToCreateFiles(true);
                    if (res.status === 200) setNeedToCreateFiles(false);

                    const widgetInfoRequest = {
                        widgetId: +model.widgetId,
                        userId: model.userId,
                        role: model.role,
                        config: model.config,
                        board: {
                            id: model.board.id,
                            name: model.board.name,
                            parentId: model.board.parentId
                        }
                    };

                    const response2 = api.apiProjectsWidgetGetInfoPost(widgetInfoRequest).then(response2 => {
                        console.log('Статус ответа:', response2);
                    })
                });

        } catch (error) {
            console.error('Ошибка при создании/получении проекта:', error);
            throw error; // или верни false/по умолчанию
        }
    }

    // В useCompiler.ts обновляем функцию addDocument:
    const addDocument = (fileName?: string, path?: string) => {
        // Если передано имя файла - используем его, иначе генерируем
        const defaultName = `file${documents.length + 1}.cs`;
        const finalName = fileName || defaultName;

        let fileId = "";

        fileApi.apiFilesProjectProjectIdPost(projectId, {
            name: finalName,
            path: path
        })
            .then(res => {
                fileId = res.data;

                // Определяем язык по расширению
                let language: "javascript" | "csharp" = "csharp";
                if (finalName.endsWith('.js')) {
                    language = "javascript";
                }

                // Начальное содержимое в зависимости от языка
                let initialContent = "// New file";
                if (language === "javascript") {
                    initialContent = "// JavaScript file";
                }

                const finalPath = path ? path : "";

                const newDoc: EditorDocument = {
                    id: fileId,
                    path: finalPath,
                    name: finalName,
                    language: language,
                    content: initialContent,
                    modified: false,
                };

                setDocuments(d => [...d, newDoc]);
                setSelectedId(newDoc.id);

                // Сохраняем начальное содержимое
                fileApi.apiFilesFileIdSavePost(fileId, {
                    content: initialContent,
                });
            })
            .catch(err => {
                alert(`Ошибка при создании файла: ${err.message}`);
            });
    };

    const updateDocPath = (fileId: string, newPath: string) => {
        setDocuments(prev => {
            const newDocs = prev.map(doc =>
                doc.id === fileId ? { ...doc, path: newPath, modified: true } : doc
            );
            return newDocs;
        });
        fileApi.apiFilesFileIdMovePost(fileId, newPath);
    };


    const updateOneDocPath = (id: string, newPath: string) => {
        setDocuments(docs =>
            docs.map(doc => doc.id === id ? { ...doc, path: newPath, modified: true } : doc)
        )
    }

    const updatePath = (id: number, oldPath: string, newPath: string) => {
        setDocuments(prevDocs =>
            prevDocs.map(doc => {
                if (doc.path?.startsWith(oldPath)) {
                    const newDocPath = doc.path.replace(oldPath, newPath);
                    return { ...doc, path: newDocPath, modified: true };
                }
                return doc;
            })
        );
        fileApi.apiFilesProjectProjectIdChangeAllPathsPost(id, { oldPath, newPath })
    }

    const updateDocument = (id: string, patch: Partial<EditorDocument>) => {
        const doc = documents.find(d => d.id === id);
        if (!doc) return;


        setDocuments(docs =>
            docs.map(doc => doc.id === id ? { ...doc, ...patch, modified: true } : doc)
        );

        if (patch.name !== undefined && patch.name !== doc.name) {
            fileApi.apiFilesFileIdRenamePost(id, {
                name: patch.name
            }).catch(err => {
                setDocuments(docs =>
                    docs.map(d => d.id === id ? { ...d, name: doc.name } : d)
                );
            });
        }


        if (patch.modified) {
            fileApi.apiFilesFileIdSavePost(id, {
                content: patch.content,
            });
        }
    };


    const deleteDocument = (id: string) => {
        fileApi.apiFilesFileIdDeletePost(id)
            .then(() => setDocuments(docs => docs.filter(doc => doc.id !== id)))
            .catch(err => alert(err));
    };

    const saveAll = () => {
        // Находим измененные документы
        const modifiedDocs = documents.filter(doc => doc.modified);

        if (modifiedDocs.length === 0) {
            console.log("Нет изменений для сохранения");
            return;
        }

        console.log(`Сохранение ${modifiedDocs.length} файлов`);

        // Создаем массив промисов для сохранения
        const savePromises = modifiedDocs.map(doc =>
            fileApi.apiFilesFileIdSavePost(doc.id, {
                content: doc.content
            })
        );

        // Выполняем все запросы
        Promise.all(savePromises)
            .then(() => {
                // После успешного сохранения всех файлов сбрасываем флаг modified
                setDocuments(docs =>
                    docs.map(doc => ({
                        ...doc,
                        // Если документ был среди измененных - сбрасываем флаг
                        modified: modifiedDocs.some(md => md.id === doc.id) ? false : doc.modified
                    }))
                );
            })
            .catch(error => {
                alert("Ошибка сохранения файлов");
            });
    };

    const run = async () => {
        await saveAll()
        setOutput("Запуск программы...")
        const res = await compilerApi.apiCompileProjectProjectIdRunPost(projectId, {
            mainFile: "ConsoleApp.csproj"
        });

        console.log(res);
        console.log(errorToView(res.data.errors));


        setOutput(res.data.output ? res.data.output : errorToView(res.data.errors) ?? "");
        console.log();


        await stop();
    }
    const stop = () => {
        compilerApi.apiCompileProjectProjectIdStopPost(projectId);
    }

    const errorToView = (errors: CompilationError[] | undefined | null): string => {
        return errors?.map(err => err.errorCode + " " + err.message)?.join(", ") ?? "";
    };



    return {
        documents,
        selectedDocument,
        selectedId,
        setSelectedId,
        setDocumentContent,
        addDocument,
        updatePath,
        updateDocPath,
        updateDocument,
        deleteDocument,
        updateOneDocPath,
        iaScazalaStartuem,
        run,
        stop,
        output,
        saveAll,
        isInitialized,
        history: [],
    };
}

